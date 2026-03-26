import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

function Chat() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;
  const myId = user?.userId;

  // -------- CONNECT SOCKET --------
  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    const newSocket = io("http://localhost:5000", {
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("conversation", (msgs) => {
      setMessages(msgs);
    });

    newSocket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => newSocket.disconnect();
  }, [token]);

  // -------- AUTO SCROLL --------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinChat = () => {
    if (!receiverId || !socket) return;
    socket.emit("joinRoom", receiverId);
    socket.emit("loadMessages", receiverId);
  };

  const sendMessage = () => {
    if (!text || !receiverId || !socket) return;

    socket.emit("sendMessage", {
      receiver: receiverId,
      text,
    });

    setText("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const isReceiverOnline = onlineUsers.includes(receiverId);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <h2>💬 Private Chat</h2>
          <div style={styles.userInfo}>
            Logged in as:
            <div style={styles.userId}>{myId}</div>
          </div>
        </div>

        <input
          placeholder="Enter Receiver User ID"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          style={styles.input}
        />

        <button onClick={joinChat} style={styles.button}>
          Join Chat
        </button>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {receiverId && (
          <div style={styles.chatHeader}>
            Chatting with: {receiverId}
            {isReceiverOnline && <span style={styles.onlineDot}></span>}
          </div>
        )}

        <div style={styles.messages}>
          {messages.map((msg, index) => {
            const isMine = msg.sender?._id === myId;

            return (
              <div
                key={index}
                style={{
                  ...styles.messageWrapper,
                  justifyContent: isMine ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    background: isMine ? "#4f46e5" : "#e5e7eb",
                    color: isMine ? "white" : "black",
                  }}
                >
                  <div style={styles.sender}>
                    {isMine ? "You" : msg.sender?.name}
                  </div>
                  <div>{msg.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            style={styles.textInput}
          />
          <button onClick={sendMessage} style={styles.sendBtn}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", height: "100vh", fontFamily: "Arial" },
  sidebar: { width: "280px", background: "#1f2937", color: "white", padding: "20px" },
  sidebarTop: { marginBottom: "20px" },
  userInfo: { fontSize: "12px", marginTop: "10px", opacity: 0.8 },
  userId: { wordBreak: "break-all", fontSize: "10px" },
  chatArea: { flex: 1, display: "flex", flexDirection: "column" },
  chatHeader: { padding: "10px 20px", background: "white", borderBottom: "1px solid #ddd", fontWeight: "bold" },
  onlineDot: { display: "inline-block", width: "10px", height: "10px", background: "green", borderRadius: "50%", marginLeft: "10px" },
  messages: { flex: 1, padding: "20px", overflowY: "auto", background: "#f3f4f6" },
  messageWrapper: { display: "flex", marginBottom: "10px" },
  messageBubble: { maxWidth: "60%", padding: "10px 15px", borderRadius: "15px" },
  sender: { fontSize: "12px", marginBottom: "4px", opacity: 0.7 },
  inputArea: { display: "flex", padding: "15px", background: "white", borderTop: "1px solid #ddd" },
  textInput: { flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ccc", outline: "none" },
  sendBtn: { marginLeft: "10px", padding: "10px 20px", background: "#4f46e5", color: "white", border: "none", borderRadius: "20px", cursor: "pointer" },
  input: { width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "5px", border: "none" },
  button: { width: "100%", padding: "8px", background: "#4f46e5", color: "white", border: "none", cursor: "pointer" },
  logoutBtn: { width: "100%", padding: "8px", marginTop: "15px", background: "#ef4444", color: "white", border: "none", cursor: "pointer" },
};

export default Chat;