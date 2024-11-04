const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {}; // Store rooms

// Serve static files
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Function to generate a random room ID
function generateRoomId(length = 6) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2)
    .toUpperCase(); // Generate random ID in uppercase
}

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("createRoom", () => {
    let roomId;
    do {
      roomId = generateRoomId(); // Generate a new room ID
    } while (rooms[roomId]); // Ensure uniqueness

    rooms[roomId] = { users: [] };
    rooms[roomId].users.push(socket.id);
    socket.join(roomId);
    socket.emit("roomJoined", roomId); // Send room ID back to client
    console.log(`Room created: ${roomId}`);
  });

  socket.on("joinRoom", (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].users.push(socket.id);
      socket.join(roomId);
      socket.emit("roomJoined", roomId);
      console.log(`User joined room: ${roomId}`);
    } else {
      socket.emit("error", "Room does not exist");
    }
  });

  socket.on("signal", (data) => {
    const { roomId } = data;
    socket.to(roomId).emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    // Optionally handle user disconnect logic here
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
