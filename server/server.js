const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const Message = require("./models/Message");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// ---------------- ONLINE USERS ----------------
const onlineUsers = new Map();

// ---------------- SOCKET AUTH ----------------
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, "supersecretkey");
    socket.user = decoded; // contains userId
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// ---------------- SOCKET CONNECTION ----------------
io.on("connection", (socket) => {
  const userId = socket.user.userId;

  console.log("User connected:", userId);

  // Add to online list
  onlineUsers.set(userId, socket.id);
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));

  // -------- JOIN ROOM --------
  socket.on("joinRoom", (receiverId) => {
    const roomId = [userId, receiverId].sort().join("_");
    socket.join(roomId);
  });

  // -------- LOAD MESSAGES --------
  socket.on("loadMessages", async (receiverId) => {
    try {
      const roomId = [userId, receiverId].sort().join("_");

      const messages = await Message.find({ room: roomId })
        .populate("sender", "name")
        .sort({ createdAt: 1 });

      socket.emit("conversation", messages);
    } catch (error) {
      console.log("Load messages error:", error);
    }
  });

  // -------- SEND MESSAGE --------
  socket.on("sendMessage", async ({ receiver, text }) => {
    try {
      const roomId = [userId, receiver].sort().join("_");

      const newMessage = await Message.create({
        sender: userId,
        receiver,
        room: roomId, // REQUIRED FIELD FIXED
        text,
      });

      const populatedMessage = await newMessage.populate(
        "sender",
        "name"
      );

      io.to(roomId).emit("receiveMessage", populatedMessage);
    } catch (error) {
      console.log("Send message error:", error);
    }
  });

  // -------- DISCONNECT --------
  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log("User disconnected:", userId);
  });
});

// ---------------- ROUTES ----------------
app.get("/", (req, res) => {
  res.json({ message: "Backend running successfully" });
});

app.use("/api/auth", authRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

// ---------------- DATABASE ----------------
mongoose
  .connect("mongodb://127.0.0.1:27017/chat-app")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

// ---------------- START SERVER ----------------
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});