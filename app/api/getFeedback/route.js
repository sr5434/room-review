import { NextResponse } from 'next/server';
import OpenAI from "openai";
const aiplatform = require("@google-cloud/aiplatform");
import axios from 'axios';

export const maxDuration = 60; // Set to 60 seconds
export const dynamic = 'force-dynamic';

const {PredictionServiceClient} = aiplatform.v1;

// Import the helper module for converting arbitrary protobuf.Value objects
const {helpers} = aiplatform;

const projectId = process.env.GCP_PROJECT_ID;
const location = 'us-central1';

const clientOptions = {
  apiEndpoint: `${location}-aiplatform.googleapis.com`,
};

// Instantiates a client
const predictionServiceClient = new PredictionServiceClient(clientOptions);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req){
    const { url } = await req.json();
    let messages = [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": "Tell the user how to improve the design of their room."
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "image_url",
            "image_url": {
              "url": url
            }
          }
        ]
      },
    ];
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        response_format: {
          "type": "text"
        },
        temperature: 1,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    });
    const feedback = response.choices[0].message.content;
    messages.push({
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": feedback
        }
      ]
    });
    messages.push({
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Now create a prompt for an image editing AI describing how this room could be bettrer.Don't use instructive text in your prompt. Instead, describe what you want your edits to be. For example, consider an existing image of a cat you want to change to a dog. An mask-free edit prompt of \"a dog\" might be more effective than \"change the cat to a dog\". Avoid using markdown in the prompt."
        }
      ]
    })
    const response2 = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        response_format: {
          "type": "text"
        },
        temperature: 1,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    });
    const prompt = response2.choices[0].message.content;
    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@002`;

    const image = await axios.get(url,  { responseType: 'arraybuffer' })
    // Convert the image data to a Buffer and base64 encode it.
    const encodedImage = Buffer.from(image.data, "utf-8").toString('base64');
    const promptObj = {
      prompt: prompt, // The text prompt describing what you want to see
      image: {
        bytesBase64Encoded: encodedImage,
      },
    };
    const instanceValue = helpers.toValue(promptObj);
    const instances = [instanceValue];

    const parameter = {
      // Optional parameters
      seed: 100,
      // Controls the strength of the prompt
      // 0-9 (low strength), 10-20 (medium strength), 21+ (high strength)
      guidanceScale: 15,
      sampleCount: 1,
    };
    const parameters = helpers.toValue(parameter);

    const request = {
      endpoint,
      instances,
      parameters,
    };

    // Predict request
    const [newImage] = await predictionServiceClient.predict(request);
    const predictions = newImage.predictions;
    const newImageData = predictions[0].structValue.fields.bytesBase64Encoded.stringValue;
    const newImageType = predictions[0].structValue.fields.mimeType.stringValue;
    //We have to format it with the encoding type for the img tag to display it
    const newImageDataFormatted = `data:${newImageType};base64,${newImageData}`;
    return NextResponse.json({ feedback: feedback, newImageData: newImageDataFormatted });
}