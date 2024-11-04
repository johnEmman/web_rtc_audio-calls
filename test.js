const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const transcriptionDiv = document.getElementById("transcription");

let recognition;
let isTranscribing = false;

if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    transcriptionDiv.innerText = transcript;
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event);
  };

  recognition.onend = () => {
    isTranscribing = false;
    startButton.disabled = false;
    stopButton.disabled = true;
  };
} else {
  alert("Speech recognition not supported in this browser.");
}

startButton.onclick = () => {
  if (!isTranscribing) {
    recognition.start();
    isTranscribing = true;
    startButton.disabled = true;
    stopButton.disabled = false;
  }
};

stopButton.onclick = () => {
  if (isTranscribing) {
    recognition.stop();
  }
};
