import { useNotification } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import { formatTimeAgo } from "../utils/timeAgo";
import { getInitials, getAvatarColor } from "../utils/avatarHelper";

const Notifications = () => {
  const { notifications, setNotifications } = useNotification();
  const navigate = useNavigate();

  // ✅ Hoisted to use in both useEffect and button
  const cleanupOldSeenNotifications = async () => {
    try {
      await axios.delete("http://localhost:8000/api/notifications/cleanup", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Filter out deleted ones (seen & older than 5 mins)
      setNotifications(prev =>
        prev.filter(
          n =>
            !(
              n.seen &&
              new Date(n.createdAt) < new Date(Date.now() - 5 * 60 * 1000)
            )
        )
      );
    } catch (error) {
      console.error("Cleanup failed", error);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (error) {
        console.error("Error fetching notifications", error);
      }
    };

    fetchNotifications();
    cleanupOldSeenNotifications(); // 🧹 run once on mount
  }, []);

  const handleSeen = async (id, userId) => {
    try {
      await fetch(`http://localhost:8000/api/notifications/seen/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, seen: true } : n))
      );

      navigate(`/user/${userId}`);
    } catch (error) {
      console.error("Error marking notification as seen", error);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <span>Seen Auto deleted</span>
   
      </div>

      {notifications.length === 0 && <div>No notifications</div>}
      <ul>
        {notifications
          .filter(n =>
            ["like", "comment", "unlike", "follow", "unfollow", "follow back", "mutulfollow"].includes(n.type)
          )
          .map(n => (
            <li
              key={n._id}
              className={`p-4 mb-2 rounded shadow ${
                n.seen ? "bg-gray-100" : "bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {n?.from?.avatar ? (
                  <img
                    src={`http://localhost:8000${n.from.avatar}`}
                    alt="avatar"
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: getAvatarColor(n?.from?.name) }}
                  >
                    {getInitials(n?.from?.name)}
                  </div>
                )}

                <div>
                  <span className="font-semibold">{n?.from?.name || "Unknown"}</span>
                  <span className="ml-2">{n.message}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {n.createdAt ? formatTimeAgo(n.createdAt) : "just now"}
                  </span>
                </div>
              </div>

              <button
                className="text-blue-600 underline mt-2"
                onClick={() => {
                  if (n?.from?._id) {
                    handleSeen(n._id, n.from._id);
                  } else {
                    console.warn("Notification does not have valid from._id", n);
                  }
                }}
              >
                View Profile
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Notifications;
