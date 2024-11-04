const socket = io();
let localStream;
let peerConnection;
let currentRoomId;

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // STUN server
  ],
};

document.getElementById("createRoomButton").onclick = createRoom;
document.getElementById("joinRoomButton").onclick = joinRoom;
document.getElementById("hangupButton").onclick = hangUp;

async function createRoom() {
  socket.emit("createRoom");
}

async function joinRoom() {
  const roomId = prompt("Enter Room ID to join:");
  if (roomId) {
    startTranscription();

    socket.emit("joinRoom", roomId);
  } else {
    displayError("Room ID cannot be empty!");
  }
}

async function startCall() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(servers);

    localStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          roomId: currentRoomId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteAudio = document.getElementById("remoteAudio");
      remoteAudio.srcObject = event.streams[0];
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("signal", { roomId: currentRoomId, offer });

    // Start speech recognition automatically
    // startTranscription();
  } catch (error) {
    console.error("Error starting call:", error);
    displayError("Error starting call. Please check your microphone settings.");
  }
}

function hangUp() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    console.log("Call ended.");
    document.getElementById("hangupButton").disabled = true;
  } else {
    console.log("No active call to hang up.");
  }
}

socket.on("signal", async (data) => {
  if (!peerConnection) {
    console.error("Peer connection is not initialized.");
    return;
  }

  if (data.offer) {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signal", { roomId: currentRoomId, answer });
  } else if (data.answer) {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  } else if (data.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

// Listen for room join confirmations
socket.on("roomJoined", (roomId) => {
  currentRoomId = roomId;
  document.getElementById("roomInfo").innerText = `You are in room: ${roomId}`;
  document.getElementById("hangupButton").disabled = false;
  startCall(); // Start the call
});

// Handle errors
socket.on("error", (message) => {
  displayError(message);
});

// Function to display errors
function displayError(message) {
  const errorMessageElement = document.getElementById("errorMessage");
  errorMessageElement.innerText = message;
  setTimeout(() => {
    errorMessageElement.innerText = ""; // Clear the error after 5 seconds
  }, 5000);
}
