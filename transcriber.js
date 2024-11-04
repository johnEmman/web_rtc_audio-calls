const transcriptionDiv = document.getElementById("transcription");
let recognition;
let isTranscribing = false;
let restartAttemptCount = 0;
const maxRestarts = 3; // Limit the number of restart attempts

// Function to initialize speech recognition
function initSpeechRecognition() {
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcriptionDiv.innerText = transcript; // Update transcription
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "aborted") {
        console.log("Error occurred, will attempt to restart after a delay.");
        handleErrorRestart();
      }
    };

    recognition.onend = () => {
      isTranscribing = false; // Set flag to false when ended
      console.log("Speech recognition has ended.");
      handleErrorRestart();
    };
  } else {
    alert("Speech recognition not supported in this browser.");
  }
}

// Function to start speech recognition
function startTranscription() {
  if (!isTranscribing) {
    console.log("Starting speech recognition...");
    recognition.start();
    isTranscribing = true;
    restartAttemptCount = 0; // Reset restart attempts
  } else {
    console.log("Speech recognition is already running.");
  }
}

// Function to handle restart attempts after an error
function handleErrorRestart() {
  if (restartAttemptCount < maxRestarts) {
    restartAttemptCount++;
    setTimeout(() => {
      startTranscription(); // Attempt to restart
    }, 2000); // Restart after 2 seconds
  } else {
    console.log("Maximum restart attempts reached. Please check your setup.");
  }
}

// Initialize speech recognition only once
initSpeechRecognition();
