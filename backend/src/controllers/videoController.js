const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

document.getElementById("createRoomBtn").addEventListener("click", () => {
    socket.emit("create-room");
});

socket.on("room-created", (roomCode) => {
    console.log(`Room created: ${roomCode}`);
    // Redirect to room page
});
