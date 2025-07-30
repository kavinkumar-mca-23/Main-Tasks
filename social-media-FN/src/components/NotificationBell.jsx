import React, { useContext, useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { useNotification } from "../context/NotificationContext";
// import "./NotificationBell.css"; // Add styles here if needed

const NotificationBell = ({ onOpen }) => {
  const { unseenCount, shake, setShake } = useNotification();
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (shake) {
      setAnimating(true);
      const timeout = setTimeout(() => {
        setAnimating(false);
        setShake(false);
      }, 500); // shake duration
      return () => clearTimeout(timeout);
    }
  }, [shake]);

  return (
    <div className="relative cursor-pointer" onClick={onOpen}>
      <FaBell className={`text-2xl ${animating ? "animate-shake" : ""}`} />
      {unseenCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
          {unseenCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
 