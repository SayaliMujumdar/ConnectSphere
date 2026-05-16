import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiHash, FiTrendingUp } from "react-icons/fi";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

export default function RightSidebar() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    api
      .get("/users/suggestions")
      .then(({ data }) => setSuggestions(data.suggestions.slice(0, 5)))
      .catch(() => {});
    api
      .get("/search/trending")
      .then(({ data }) => setTrending(data.trending.slice(0, 5)))
      .catch(() => {});
  }, []);

  const handleFollow = async (userId) => {
    setFollowLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.put(`/users/${userId}/follow`);
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
    } catch {
      toast.error("Action failed");
    } finally {
      setFollowLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-72 sticky top-20 h-fit py-4 space-y-4">
      {/* Suggested Users */}
      {suggestions.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-3">
            Suggested For You
          </h3>
          <div className="space-y-3">
            {suggestions.map((su) => (
              <div key={su._id} className="flex items-center gap-3">
                <Link to={`/profile/${su.username}`} className="flex-shrink-0">
                  <img
                    src={
                      su.profilePicture ||
                      `https://ui-avatars.com/api/?name=${su.username}&background=7e22ce&color=fff`
                    }
                    className="w-10 h-10 rounded-full"
                    alt=""
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${su.username}`}
                    className="text-sm font-semibold text-white hover:text-primary-400 block truncate"
                  >
                    @{su.username}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {su.followers?.length || 0} followers
                  </p>
                </div>
                <button
                  onClick={() => handleFollow(su._id)}
                  disabled={followLoading[su._id]}
                  className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded-lg font-medium transition-colors flex-shrink-0"
                >
                  {followLoading[su._id] ? "..." : "Follow"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400" /> Trending
          </h3>
          <div className="space-y-2">
            {trending.map((t) => (
              <Link
                key={t._id}
                to={`/search?q=${t._id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <FiHash className="text-primary-400 text-sm flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">{t._id}</p>
                  <p className="text-xs text-gray-500">{t.count} posts</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 px-2">© 2024 ConnectSphere</p>
    </aside>
  );
}
