const { io } = require("socket.io-client");

// 🔥 PASTE YOUR LOGIN TOKEN HERE
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWE2N2ZhMWFkYmM1YTVhODlmZTE3YjciLCJpYXQiOjE3NzI1MTkzOTcsImV4cCI6MTc3MjYwNTc5N30.8HtEBVG0W9iExW660zwHzweOrdqa6Oxvj8UbjzQVAwY";

// 🔥 PASTE OTHER USER ID HERE
const otherUserId = "69a68367124d364abe1e924d";

const socket = io("http://localhost:5000", {
  auth: {
    token: token,
  },
});

socket.on("connect", () => {
  console.log("Connected as authenticated user");

  socket.emit("joinRoom", otherUserId);

  socket.emit("loadMessages", otherUserId);

  socket.emit("sendMessage", {
    receiver: otherUserId,
    text: "Hello from final backend 🚀",
  });
});

socket.on("conversation", (messages) => {
  console.log("Old Conversation:", messages);
});

socket.on("receiveMessage", (message) => {
  console.log("New Message:", message);
});

socket.on("connect_error", (err) => {
  console.log("Socket Error:", err.message);
});