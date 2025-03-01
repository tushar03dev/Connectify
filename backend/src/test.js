import { io } from "socket.io-client";

const socket = io("ws://localhost:5200", {
    transports: ["websocket"]
});

socket.on("connect", () => {
    console.log("✅ Connected to WebSocket Server", socket.id);
    socket.emit("joinRoom", { roomId: "12345", username: "Tushar" });
});

socket.on("roomUsers", (data) => {
    console.log("Users in Room:", data);
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected from WebSocket Server");
});
