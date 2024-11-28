"use client"
import { useState, useEffect } from "react";
import Markdown from "react-markdown";
function LoadingWidget({ uploadedImageURL }) {
  return (
    <div role="status">
      <img src={uploadedImageURL} alt="Preview" className="w-64 h-auto mb-4" />
      <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
export default function Home() {
  const [uploadURL, setUploadURL] = useState("");
  const [downloadURL, setDownloadURL] = useState("");
  const [feedback, setFeedback] = useState("");
  const [newImage, setNewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  async function createUploadURL() {
    const response = await fetch("/api/createUploadURL");
    const { url, previewURL } = await response.json();
    setUploadURL(url);
    setDownloadURL(previewURL);
  }
  useEffect(() => {
    createUploadURL();
  }, []);//TODO: Make it run once the user clicks the upload button
  async function handleChange(event) {
    setLoading(true);
    fetch(uploadURL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: event.target.files[0],
    });
    const res = await fetch('/api/getFeedback', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: downloadURL,
      }),
    });
    const { feedback, newImageData } = await res.json();

    setNewImage(newImageData);
    setLoading(false);
    setFeedback(feedback);
    createUploadURL();
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-24 sm:p-20 font-[family:var(--font-geist-sans)]">
      <h1 className="text-4xl font-bold text-center">Room Review</h1>
      {feedback==="" && loading===false ? 
      <p>Upload an image of a room to get started</p> : 
      loading===true ? <LoadingWidget uploadedImageURL={downloadURL}/> : 
      <div className="w-full max-w-3xl prose prose-slate dark:prose-invert">
        <img src={newImage}/>
        <Markdown>{feedback}</Markdown>
      </div>}
      <form>
        <label className="px-4 py-2 rounded-full border dark:bg-white bg-black dark:text-black text-white cursor-pointer">
          {fileName || "Choose File"}
          <input 
            type="file" 
            accept="image/png, image/jpeg" 
            onChange={(e) => {
              setFileName(e.target.files?.[0]?.name || "");
              handleChange(e);
            }} 
            className="hidden"
          />
        </label>
      </form>
    </div>
  );
}
