import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@latest/dist/transformers.esm.min.js";

let mediaRecorder;
const outputElement = document.getElementById("output");
const startButton = document.getElementById("start-btn");
const stopButton = document.getElementById("stop-btn");

async function initializeWhisper() {
  // Load the Whisper model
  const transcriber = await pipeline(
    "automatic-speech-recognition",
    "openai/whisper-tiny"
  );
  return transcriber;
}

async function startTranscribing(transcriber) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start();

  let audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks);
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Transcribe the audio using Whisper
    const transcription = await transcriber(arrayBuffer);
    outputElement.textContent += transcription.text + "\n"; // Append new transcription
  };

  stopButton.disabled = false;
  startButton.disabled = true;
}

function stopTranscribing() {
  mediaRecorder.stop();
  stopButton.disabled = true;
  startButton.disabled = false;
}

initializeWhisper()
  .then((transcriber) => {
    startButton.onclick = () => startTranscribing(transcriber);
    stopButton.onclick = () => stopTranscribing();
  })
  .catch((err) => {
    console.error("Error initializing Whisper model:", err);
  });
