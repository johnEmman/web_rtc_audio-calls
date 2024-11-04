const socket = io(); // Initialize a Socket.IO client connection
let localStream; // Variable for the local media stream
let peerConnection; // Variable for the peer-to-peer connection
let currentRoomId; // Variable to store the current room ID

const servers = {
  // Configuration for ICE servers
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // STUN server
  ],
};

document.getElementById("createRoomButton").onclick = createRoom; // Set up create room button
document.getElementById("joinRoomButton").onclick = joinRoom; // Set up join room button
document.getElementById("hangupButton").onclick = hangUp; // Set up hang up button

async function createRoom() {
  // Function to create a room
  currentRoomId = document.getElementById("roomId").value.trim(); // Get room ID from input
  if (!currentRoomId) {
    // Check if room ID is empty
    alert("Please enter a room ID."); // Alert user
    return;
  }
  socket.emit("createRoom", currentRoomId); // Emit create room event
}

async function joinRoom() {
  // Function to join a room
  currentRoomId = document.getElementById("roomId").value.trim(); // Get room ID from input
  if (!currentRoomId) {
    // Check if room ID is empty
    alert("Please enter a room ID."); // Alert user
    return;
  }
  socket.emit("joinRoom", currentRoomId); // Emit join room event
}

async function startCall() {
  // Function to start the call
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Request audio stream
    peerConnection = new RTCPeerConnection(servers); // Create peer connection
    console.log("Peer connection initialized."); // Log initialization

    localStream // Add local stream tracks to peer connection
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = (event) => {
      // Handle ICE candidates
      if (event.candidate) {
        // If a new candidate is available
        socket.emit("signal", {
          roomId: currentRoomId,
          candidate: event.candidate,
        }); // Emit candidate
      }
    };

    peerConnection.ontrack = (event) => {
      // Handle remote tracks
      const remoteAudio = document.getElementById("remoteAudio"); // Get remote audio element
      remoteAudio.srcObject = event.streams[0]; // Set remote audio source
    };

    const offer = await peerConnection.createOffer(); // Create offer
    await peerConnection.setLocalDescription(offer); // Set local description to the offer
    socket.emit("signal", { roomId: currentRoomId, offer }); // Emit offer
  } catch (error) {
    console.error("Error starting call:", error); // Log error if any
  }
}

function hangUp() {
  // Function to hang up the call
  if (peerConnection) {
    // If there is an active peer connection
    peerConnection.close(); // Close the connection
    peerConnection = null; // Reset peer connection variable
    console.log("Call ended."); // Log call end
  } else {
    console.log("No active call to hang up."); // Log if no active call
  }
}

socket.on("signal", async (data) => {
  // Listen for signaling messages
  if (!peerConnection) {
    // Check if peer connection is initialized
    console.error("Peer connection is not initialized."); // Log error
    return; // Exit if not initialized
  }

  if (data.offer) {
    // If an offer is received
    console.log("Received offer."); // Log receipt
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    ); // Set remote description
    const answer = await peerConnection.createAnswer(); // Create answer
    await peerConnection.setLocalDescription(answer); // Set local description to the answer
    socket.emit("signal", { roomId: currentRoomId, answer }); // Emit answer
  } else if (data.answer) {
    // If an answer is received
    console.log("Received answer."); // Log receipt
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    ); // Set remote description
  } else if (data.candidate) {
    // If an ICE candidate is received
    console.log("Received ICE candidate."); // Log receipt
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)); // Add candidate to connection
  }
});

// Listen for room join confirmations
socket.on("roomJoined", (roomId) => {
  console.log(`Joined room: ${roomId}`); // Log successful room joining
  startCall(); // Start the call after joining
});

// Handle errors
socket.on("error", (message) => {
  alert(message); // Alert user of error
  console.log("Error:", message); // Log error message
});
