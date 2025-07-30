// hooks/useSocket.js
import { useEffect, useState } from "react";
import { connectSocket, getSocket, disconnectSocket } from "../utils/socket";

const useSocket = (userId) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socketInstance, setSocketInstance] = useState(null); // ✅ manage socket locally

  useEffect(() => {
    if (!userId) return;

    connectSocket(userId);
    const socket = getSocket();

    if (!socket) return;

    setSocketInstance(socket); // ✅ ensure it's available for use

    socket.emit("userConnected", userId);

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      disconnectSocket();
    };
  }, [userId]);

  return { socket: socketInstance, onlineUsers };
};

export default useSocket;
