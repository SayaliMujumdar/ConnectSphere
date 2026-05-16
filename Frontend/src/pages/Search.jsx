import { useState, useEffect, useCallback } from "react";
import { FiSearch, FiHash, FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import Post from "../components/Post";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

export default function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("users");
  const [results, setResults] = useState({
    users: [],
    posts: [],
    hashtags: [],
  });
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    api
      .get("/search/trending")
      .then(({ data }) => setTrending(data.trending))
      .catch(() => {});
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults({ users: [], posts: [], hashtags: [] });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults({
        users: data.users || [],
        posts: data.posts || [],
        hashtags: data.hashtags || [],
      });
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const handleFollowToggle = async (userId) => {
    try {
      const { data } = await api.put(`/users/${userId}/follow`);
      setResults((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u._id === userId
            ? {
                ...u,
                followers: data.following
                  ? [...u.followers, user._id]
                  : u.followers.filter((f) => f !== user._id),
              }
            : u,
        ),
      }));
    } catch {
      toast.error("Action failed");
    }
  };

  const tabs = [
    { id: "users", label: "Users", icon: FiUser, count: results.users.length },
    { id: "posts", label: "Posts", count: results.posts.length },
    {
      id: "hashtags",
      label: "Hashtags",
      icon: FiHash,
      count: results.hashtags.length,
    },
  ];

  return (
    <div className="min-h-screen bg-dark-200">
      <Navbar />
      <div className="flex max-w-6xl mx-auto pt-16 px-4 gap-6">
        <LeftSidebar />
        <main className="flex-1 py-6">
          {/* Search Bar */}
          <div className="card p-4 mb-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              <input
                type="text"
                className="input-field pl-12 text-lg"
                placeholder="Search users, posts, hashtags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {!query.trim() ? (
            /* Trending */
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Trending Topics
              </h3>
              {trending.length === 0 ? (
                <p className="text-gray-400 text-sm">No trending topics yet</p>
              ) : (
                <div className="space-y-3">
                  {trending.map((t, i) => (
                    <button
                      key={t._id}
                      onClick={() => setQuery(t._id)}
                      className="flex items-center justify-between w-full p-3 bg-dark-300 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm font-mono w-5">
                          {i + 1}
                        </span>
                        <div className="text-left">
                          <p className="text-white font-semibold">#{t._id}</p>
                          <p className="text-gray-400 text-xs">
                            {t.count} posts
                          </p>
                        </div>
                      </div>
                      <FiHash className="text-primary-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? "bg-primary-600 text-white" : "bg-dark-100 text-gray-400 hover:text-white"}`}
                  >
                    {t.label} {query && `(${t.count})`}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  {tab === "users" && (
                    <div className="space-y-3">
                      {results.users.length === 0 ? (
                        <div className="card p-8 text-center text-gray-400">
                          No users found
                        </div>
                      ) : (
                        results.users.map((u) => (
                          <div
                            key={u._id}
                            className="card p-4 flex items-center gap-4"
                          >
                            <Link to={`/profile/${u.username}`}>
                              <img
                                src={
                                  u.profilePicture ||
                                  `https://ui-avatars.com/api/?name=${u.username}&background=7e22ce&color=fff`
                                }
                                className="w-12 h-12 rounded-full"
                                alt=""
                              />
                            </Link>
                            <div className="flex-1">
                              <Link
                                to={`/profile/${u.username}`}
                                className="font-semibold text-white hover:text-primary-400"
                              >
                                @{u.username}{" "}
                                {u.isVerified && (
                                  <span className="text-primary-400 text-xs">
                                    ✓
                                  </span>
                                )}
                              </Link>
                              {u.bio && (
                                <p className="text-gray-400 text-sm mt-1 line-clamp-1">
                                  {u.bio}
                                </p>
                              )}
                              <p className="text-gray-500 text-xs mt-1">
                                {u.followers?.length || 0} followers
                              </p>
                            </div>
                            {u._id !== user._id && (
                              <button
                                onClick={() => handleFollowToggle(u._id)}
                                className={`text-sm px-4 py-1.5 rounded-lg font-medium ${u.followers?.includes(user._id) ? "bg-dark-300 text-gray-300 hover:text-white" : "bg-primary-600 text-white hover:bg-primary-700"}`}
                              >
                                {u.followers?.includes(user._id)
                                  ? "Following"
                                  : "Follow"}
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {tab === "posts" && (
                    <div className="space-y-4">
                      {results.posts.length === 0 ? (
                        <div className="card p-8 text-center text-gray-400">
                          No posts found
                        </div>
                      ) : (
                        results.posts.map((post) => (
                          <Post
                            key={post._id}
                            post={post}
                            onDeleted={() => {}}
                            onUpdated={() => {}}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {tab === "hashtags" && (
                    <div className="space-y-3">
                      {results.hashtags.length === 0 ? (
                        <div className="card p-8 text-center text-gray-400">
                          No hashtags found
                        </div>
                      ) : (
                        results.hashtags.map((h) => (
                          <button
                            key={h._id}
                            onClick={() => {
                              setQuery(h._id);
                              setTab("posts");
                            }}
                            className="card p-4 w-full flex items-center justify-between hover:border-primary-500 border border-transparent transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
                                <FiHash className="text-primary-400" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-white">
                                  #{h._id}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {h.count} posts
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
