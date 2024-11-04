const express = require("express"); // Import the Express framework
const http = require("http"); // Import the built-in HTTP module
const socketIo = require("socket.io"); // Import Socket.IO for real-time communication
const path = require("path"); // Import the path module for handling file paths

const app = express(); // Initialize an Express application
const server = http.createServer(app); // Create an HTTP server using the Express app
const io = socketIo(server); // Initialize Socket.IO for the server

app.use(express.static(path.join(__dirname))); // Serve static files from the current directory

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html")); // Send index.html for the root URL
});

const rooms = {}; // Object to store rooms

io.on("connection", (socket) => {
  // Listen for new socket connections
  console.log("A user connected"); // Log connection

  socket.on("createRoom", (roomId) => {
    // Listen for room creation requests
    if (!roomId) {
      // Check if roomId is empty
      socket.emit("error", "Room ID cannot be empty"); // Send error back
      return;
    }

    if (!rooms[roomId]) {
      // If the room does not exist
      rooms[roomId] = { users: [] }; // Create a new room
      rooms[roomId].users.push(socket.id); // Add user to the room
      socket.join(roomId); // Join the socket to the room
      socket.emit("roomJoined", roomId); // Confirm room joining
      console.log(`Room created: ${roomId}`); // Log room creation
    } else {
      socket.emit("error", "Room already exists"); // Send error if room exists
    }
  });

  socket.on("joinRoom", (roomId) => {
    // Listen for room join requests
    if (!roomId) {
      // Check if roomId is empty
      socket.emit("error", "Room ID cannot be empty"); // Send error back
      return;
    }

    if (rooms[roomId]) {
      // If the room exists
      rooms[roomId].users.push(socket.id); // Add user to the room
      socket.join(roomId); // Join the socket to the room
      socket.emit("roomJoined", roomId); // Confirm room joining
      console.log(`User joined room: ${roomId}`); // Log user joining
    } else {
      socket.emit("error", "Room does not exist"); // Send error if room does not exist
    }
  });

  socket.on("signal", (data) => {
    // Listen for signaling messages
    const { roomId } = data; // Extract roomId from data
    socket.to(roomId).emit("signal", data); // Forward signal to users in the room
  });

  socket.on("disconnect", () => {
    // Listen for socket disconnections
    console.log("A user disconnected"); // Log disconnection
  });
});

const PORT = process.env.PORT || 3000; // Set server port
server.listen(PORT, () => {
  // Start the server
  console.log(`Server running on http://localhost:${PORT}`); // Log the running URL
});
