import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  FiHeart,
  FiMessageCircle,
  FiUserPlus,
  FiAtSign,
  FiShare2,
  FiBell,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { SocketContext } from "../context/SocketContext";
import toast from "react-hot-toast";

const iconMap = {
  like: <FiHeart className="text-pink-500" />,
  comment: <FiMessageCircle className="text-blue-400" />,
  follow: <FiUserPlus className="text-green-400" />,
  mention: <FiAtSign className="text-yellow-400" />,
  share: <FiShare2 className="text-purple-400" />,
};

export default function Notifications() {
  const {
    notifications: socketNotifs,
    setNotifications,
    setUnreadCount,
  } = useContext(SocketContext);
  const [notifications, setLocalNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get("/notifications");
        setLocalNotifications(data.notifications);
        setUnreadCount(0);
      } catch {
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
    // Mark all as read
    api.put("/notifications/read").catch(() => {});
  }, []);

  // Prepend real-time notifications
  useEffect(() => {
    if (socketNotifs.length > 0) {
      setLocalNotifications((prev) => {
        const ids = new Set(prev.map((n) => n._id));
        const newOnes = socketNotifs.filter((n) => !ids.has(n._id));
        return [...newOnes, ...prev];
      });
    }
  }, [socketNotifs]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setLocalNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read");
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  };

  return (
    <div className="min-h-screen bg-dark-200">
      <Navbar />
      <div className="flex max-w-6xl mx-auto pt-16 px-4 gap-6">
        <LeftSidebar />
        <main className="flex-1 max-w-2xl py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
            <button
              onClick={markAllRead}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Mark all read
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="card p-12 text-center">
              <FiBell className="mx-auto text-5xl text-gray-600 mb-4" />
              <p className="text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`card p-4 flex items-start gap-4 transition-colors ${!notif.read ? "border-l-2 border-primary-500" : ""}`}
                >
                  <Link
                    to={`/profile/${notif.sender?.username}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={
                        notif.sender?.profilePicture ||
                        `https://ui-avatars.com/api/?name=${notif.sender?.username}&background=7e22ce&color=fff`
                      }
                      className="w-11 h-11 rounded-full"
                      alt=""
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{iconMap[notif.type]}</span>
                      <p className="text-sm text-gray-200 flex-1">
                        <Link
                          to={`/profile/${notif.sender?.username}`}
                          className="font-semibold text-white hover:text-primary-400"
                        >
                          @{notif.sender?.username}
                        </Link>{" "}
                        {notif.text || `${notif.type}d your post.`}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="text-gray-600 hover:text-red-400 text-sm transition-colors flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
