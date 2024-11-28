import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import {v4 as uuid} from 'uuid';

const storage = new Storage({keyFilename: 'app/key.json'});
const bucketName = 'room-review-images';
const fileName = `${uuid()}.jpg`;

export async function GET(req){
    //Generate a signed URL for uploading a file and downloading it
    const uploadOptions = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: 'application/octet-stream',
    };
    const previewOptions = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };
    console.log(fileName);
    const [uploadURL] = await storage.bucket(bucketName).file(fileName).getSignedUrl(uploadOptions);
    const [previewURL] = await storage.bucket(bucketName).file(fileName).getSignedUrl(previewOptions);
    //Test command: curl localhost:3000/api/createUploadURL
    //Test upload: curl -X PUT -H 'Content-Type: application/octet-stream' --upload-file skibidi.jpg ''
    return NextResponse.json({ url: uploadURL, previewURL: previewURL });
}