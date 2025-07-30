import { useState, useEffect, useRef } from "react";
import axios, { setAuthToken } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { getAvatarColor, getInitials } from "../../utils/avatarHelper";
import { io } from "socket.io-client";

const ChatWindow = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeoutMsg, setTimeoutMsg] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [mentionList, setMentionList] = useState([]);
  const [showMention, setShowMention] = useState(false);

  const { user: currentUser, token } = useAuth();
  const chatBoxRef = useRef();
  const socketRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  // ✅ Initialize socket
  useEffect(() => {
    if (!currentUser?.id) return;

    socketRef.current = io("http://localhost:8000", {
      query: { userId: currentUser.id },
    });

    const socket = socketRef.current;

    socket.on("receive-message", (message) => {
      setMessages((prev) => [...prev, message]);
      socket.emit("message-delivered", { messageId: message._id, receiverId: message.sender });
    });

    socket.on("message-status-updated", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, status } : msg))
      );
    });

    socket.on("typing", ({ senderId }) => setTypingUser(senderId));
    socket.on("stop-typing", () => setTypingUser(null));
    socket.on("online-users", (users) => setOnlineUsers(users));

    return () => socket.disconnect();
  }, [currentUser?.id]);

  // ✅ Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!user?.data?._id || !currentUser?.id) return;

      setLoading(true);
      const timer = setTimeout(() => setTimeoutMsg(true), 5000);

      try {
        const url =
          user.type === "group"
            ? `/group/${user.data._id}/messages`
            : `/message/${currentUser.id}/${user.data._id}`;
        const res = await axios.get(url);
        setMessages(res.data);

        if (user.type === "group" && user.data.members) {
          setMembers(user.data.members);
        }
      } catch (err) {
        console.error("❌ Failed to load messages:", err);
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    };

    loadMessages();
  }, [user?.data?._id, user?.type, currentUser?.id]);

  // ✅ Send message
  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      const url =
        user.type === "group"
          ? `/group/${user.data._id}/message`
          : `/message`;

      const payload =
        user.type === "group"
          ? { content: text }
          : { receiverId: user.data._id, content: text };

      const res = await axios.post(url, payload);
      setMessages((prev) => [...prev, { ...res.data, status: "sent" }]);
      setText("");

      socketRef.current.emit("send-message", {
        chatId: user.type === "group" ? user.data._id : currentUser.id + user.data._id,
        message: res.data,
      });
    } catch (err) {
      console.error("❌ Failed to send message:", err);
    }
  };

  // ✅ Typing + Mention dropdown
  const handleTyping = (e) => {
    const val = e.target.value;
    setText(val);

    if (!socketRef.current || !socketRef.current.connected) return;

    const chatId =
      user.type === "group"
        ? user.data._id
        : [currentUser.id, user.data._id].sort().join("-");

    socketRef.current.emit("typing", { chatId, senderId: currentUser.id });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("stop-typing", { chatId, userId: currentUser.id });
      }
    }, 1500);

    // ✅ Show mentions only in group chats
    if (user.type === "group" && val.endsWith("@")) {
      setMentionList(members.map((m) => m.user.name));
      setShowMention(true);
    } else {
      setShowMention(false);
    }
  };

  // ✅ Seen status
  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((msg) => {
        if (msg.receiver === currentUser.id && msg.status !== "seen") {
          socketRef.current.emit("seen", {
            messageId: msg._id,
            userId: currentUser.id,
          });
        }
      });
    }
  }, [messages]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString()
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const isCurrentUserAdmin = members.some(
    (m) => m.user._id === currentUser.id && m.role === "admin"
  );

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await axios.delete(
        `/group/${user.data._id}/remove-member/${memberId}`
      );
      setMembers(res.data.members);
      alert("✅ Member removed successfully");
    } catch (err) {
      console.error("❌ Failed to remove member:", err);
      alert("❌ Failed to remove member");
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200 relative">
      {/* Loading & Timeout */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
        </div>
      )}
      {timeoutMsg && !loading && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-sm bg-yellow-100 px-3 py-1 rounded-md shadow">
          ⚠ If chat doesn’t load, please refresh and try again.
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center gap-3">
        {user?.data?.avatar ? (
          <img
            src={`http://localhost:8000${user.data.avatar}`}
            alt={user.data.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border border-gray-300"
            style={{ backgroundColor: getAvatarColor(user?.data?.name || "") }}
          >
            {getInitials(user?.data?.name || "")}
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{user?.data?.name}</h2>
            {user?.type !== "group" && onlineUsers.includes(user.data._id) && (
              <span className="ml-2 text-green-500 text-xs">● Online</span>
            )}
            {user?.type === "group" && (
              <>
                <small className="text-xs bg-gray-200 px-2 py-1 rounded">Group</small>
                {user?.data?.createdBy?.name && (
                  <small className="text-xs text-gray-500 ml-2">
                    Created by: {user.data.createdBy.name}
                  </small>
                )}
              </>
            )}
          </div>

          {/* Typing */}
          {typingUser && typingUser !== currentUser.id && (
            <span className="text-xs text-blue-500">Typing...</span>
          )}

          {user?.type === "group" && (
            <button
              onClick={() => setShowMembers(true)}
              className="text-blue-600 text-xs mt-1 hover:underline"
            >
              View Members
            </button>
          )}
        </div>
      </div>

      {/* Members Popup */}
      {showMembers && (
        <div className="absolute top-16 right-4 w-64 bg-white border rounded-lg shadow-lg z-50 p-3 max-h-60 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Group Members</h4>
            <button
              onClick={() => setShowMembers(false)}
              className="text-red-500 text-xs hover:underline"
            >
              Close
            </button>
          </div>
          {members.map((member) => (
            <div
              key={member.user._id}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded justify-between"
            >
              <div className="flex items-center gap-2">
                {member.user.avatar ? (
                  <img
                    src={`http://localhost:8000${member.user.avatar}`}
                    alt={member.user.name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold border border-gray-300"
                    style={{ backgroundColor: getAvatarColor(member.user.name) }}
                  >
                    {getInitials(member.user.name)}
                  </div>
                )}
                <span className="text-sm">{member.user.name}</span>
                {member.role === "admin" && (
                  <small className="text-xs bg-green-200 px-1 rounded">Admin</small>
                )}
              </div>

              {isCurrentUserAdmin && member.user._id !== currentUser.id && (
                <button
                  onClick={() => handleRemoveMember(member.user._id)}
                  className="text-red-500 text-xs hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((msg) => {
          const isMine =
            msg.sender?._id === currentUser.id || msg.sender === currentUser.id;

          return (
            <div
              key={msg._id}
              className={`p-2 rounded-md max-w-xs flex flex-col ${
                isMine
                  ? "bg-blue-500 text-white self-end ml-auto"
                  : "bg-gray-200 text-gray-800 self-start mr-auto"
              }`}
            >
              {user.type === "group" && !isMine && (
                <span className="text-xs font-semibold mb-1 text-gray-700">
                  {msg.sender?.name}
                </span>
              )}
              <span className="text-base">
                {msg.content.split(" ").map((word, i) =>
                  word.startsWith("@") ? (
                    <span key={i} className="text-blue-600 font-semibold">{word} </span>
                  ) : (
                    word + " "
                  )
                )}
              </span>

              {isMine && (
                <span className="text-[11px] opacity-80 mt-1 self-end">
                  {msg.status === "sent" && "✓"}
                  {msg.status === "delivered" && "✓✓"}
                  {msg.status === "seen" && (
                    <span className="text-blue-200">✓✓</span>
                  )}
                </span>
              )}

              <span className="text-[11px] opacity-70 mt-1 self-end">
                {formatTimestamp(msg.createdAt)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white flex items-center relative">
        <input
          type="text"
          value={text}
          onChange={handleTyping}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 pr-12 border rounded-full focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="absolute right-6 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        >
          📩
        </button>

        {/* Mention Dropdown */}
        {showMention && (
          <ul className="absolute bottom-14 left-4 bg-white border rounded shadow w-40 z-50">
            {mentionList.map((name) => (
              <li
                key={name}
                className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setText((prev) => prev + name + " ");
                  setShowMention(false);
                }}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
