// // src/socket.js
// import { io } from "socket.io-client";

// const SOCKET_URL = "http://localhost:8000"; // your backend URL

// let socket;

// export const connectSocket = (userId) => {
//   if (!socket && userId) {
//     socket = io(SOCKET_URL, {
//       query: { userId },
//     });

//     console.log("Socket connected:", socket.id);
//   }
// };

// export const getSocket = () => socket;

// export const disconnectSocket = () => {
//   if (socket) {
//     socket.disconnect();
//     socket = null;
//     console.log("Socket disconnected");
//   }
// };

// utils/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
  autoConnect: false,
  withCredentials: true,
});

export default socket;
