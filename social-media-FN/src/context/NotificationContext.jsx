import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ userId, children }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
   const [unseenCount, setUnseenCount] = useState(0);
  const [shake, setShake] = useState(false);

  // Setup socket connection and receive notifications
  useEffect(() => {
    if (!userId) return;
    const s = io("https://main-tasks-backend.onrender.com", {
      query: {userId}
    });
    setSocket(s);
    s.emit("register", userId);

    s.on("notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnseenCount((count) => count + 1);

      // Trigger shake animation for 2 seconds
      setShake(true);
      setTimeout(() => setShake(false), 2000);

      // Optional: show toast
      showNotificationToast(notif.message || "You have a new notification");
    });

    return () => s.disconnect();
  }, [userId]);

  // Initial load from DB
  useEffect(() => {
    if (!userId) return;
    fetch(`https://main-tasks-backend.onrender.com/api/notifications`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then((data) => {
        setNotifications(data);
      const unseen = data.filter((n) => !n.seen).length;
        setUnseenCount(unseen);
  }) 
  .catch((error)=>{
    console.error("Failed to fetch notifications:", err)
  });
},[userId]);

   const markAllAsSeen = () => {
    setUnseenCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications ,socket, unseenCount,setUnseenCount ,shake,setShake,markAllAsSeen}}>
      {children}
    </NotificationContext.Provider>
  );
};
