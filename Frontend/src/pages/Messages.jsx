import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiSearch,
  FiEdit,
  FiArrowLeft,
  FiSend,
  FiImage,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { format } from "date-fns";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { SocketContext } from "../context/SocketContext";

export default function Messages() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const {
    addMessageListener,
    emitTyping,
    emitStopTyping,
    joinConversation,
    leaveConversation,
    onlineUsers,
  } = useContext(SocketContext);
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get("/messages/conversations");
      setConversations(data.conversations);
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!conversationId) return;
    const conv = conversations.find((c) => c._id === conversationId);
    if (conv) setActiveConv(conv);
  }, [conversationId, conversations]);

  useEffect(() => {
    if (!activeConv) return;
    joinConversation(activeConv._id);
    fetchMessages(activeConv._id);
    return () => leaveConversation(activeConv._id);
  }, [activeConv]);

  useEffect(() => {
    const removeListener = addMessageListener(
      ({ conversationId: cId, message }) => {
        if (activeConv?._id === cId) {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
        }
        setConversations((prev) =>
          prev.map((c) => (c._id === cId ? { ...c, lastMessage: message } : c)),
        );
      },
    );
    return removeListener;
  }, [activeConv, addMessageListener]);

  const fetchMessages = async (convId) => {
    setMsgLoading(true);
    try {
      const { data } = await api.get(`/messages/${convId}`);
      setMessages(data.messages);
      setTimeout(scrollToBottom, 100);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setMsgLoading(false);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/${activeConv._id}`, {
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      scrollToBottom();
      emitStopTyping(activeConv._id);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    emitTyping(activeConv?._id);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(
      () => emitStopTyping(activeConv?._id),
      1500,
    );
  };

  const handleSearchUser = async (q) => {
    setSearchUser(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/search?q=${q}&type=users`);
      setSearchResults(data.users?.filter((u) => u._id !== user._id) || []);
    } catch {
      /* silent */
    }
  };

  const startConversation = async (participantId) => {
    try {
      const { data } = await api.post("/messages/conversation", {
        participantId,
      });
      const exists = conversations.find((c) => c._id === data.conversation._id);
      if (!exists) setConversations((prev) => [data.conversation, ...prev]);
      setActiveConv(data.conversation);
      navigate(`/messages/${data.conversation._id}`);
      setSearchUser("");
      setSearchResults([]);
    } catch {
      toast.error("Could not start conversation");
    }
  };

  const getConvName = (conv) => {
    if (conv.isGroup) return conv.groupName;
    const other = conv.participants?.find((p) => p._id !== user._id);
    return other?.username || "Unknown";
  };

  const getConvAvatar = (conv) => {
    if (conv.isGroup) return null;
    const other = conv.participants?.find((p) => p._id !== user._id);
    return (
      other?.profilePicture ||
      `https://ui-avatars.com/api/?name=${other?.username}&background=7e22ce&color=fff`
    );
  };

  const isOnline = (conv) => {
    if (conv.isGroup) return false;
    const other = conv.participants?.find((p) => p._id !== user._id);
    return other && onlineUsers.has(other._id);
  };

  return (
    <div className="min-h-screen bg-dark-200">
      <Navbar />
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <div className="w-80 border-r border-white/5 flex flex-col bg-dark-100">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-xl font-bold text-white mb-3">Messages</h2>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                className="input-field pl-9 text-sm"
                placeholder="Search users..."
                value={searchUser}
                onChange={(e) => handleSearchUser(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 bg-dark-300 rounded-xl border border-white/10 overflow-hidden">
                {searchResults.slice(0, 5).map((u) => (
                  <button
                    key={u._id}
                    onClick={() => startConversation(u._id)}
                    className="flex items-center gap-3 w-full p-3 hover:bg-white/5 text-left"
                  >
                    <img
                      src={
                        u.profilePicture ||
                        `https://ui-avatars.com/api/?name=${u.username}&background=7e22ce&color=fff`
                      }
                      className="w-8 h-8 rounded-full"
                      alt=""
                    />
                    <span className="text-sm text-white">{u.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-6">
                <LoadingSpinner />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-6 text-gray-400 text-sm">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => {
                    setActiveConv(conv);
                    navigate(`/messages/${conv._id}`);
                  }}
                  className={`flex items-center gap-3 w-full p-4 hover:bg-white/5 transition-colors ${activeConv?._id === conv._id ? "bg-white/5 border-r-2 border-primary-500" : ""}`}
                >
                  <div className="relative flex-shrink-0">
                    {conv.isGroup ? (
                      <div className="w-12 h-12 bg-primary-700 rounded-full flex items-center justify-center">
                        <FiUsers className="text-white" />
                      </div>
                    ) : (
                      <img
                        src={getConvAvatar(conv)}
                        className="w-12 h-12 rounded-full"
                        alt=""
                      />
                    )}
                    {isOnline(conv) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">
                      {getConvName(conv)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessage?.content || "Start chatting"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeConv ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-dark-100">
              <img
                src={getConvAvatar(activeConv)}
                className="w-10 h-10 rounded-full"
                alt=""
              />
              <div>
                <p className="font-semibold text-white">
                  {getConvName(activeConv)}
                </p>
                {isOnline(activeConv) && (
                  <p className="text-xs text-green-400">Online</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  No messages yet. Say hi! 👋
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn =
                    msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg`}>
                        {msg.media && (
                          <img
                            src={msg.media}
                            className="rounded-xl mb-1 max-w-full"
                            alt="media"
                          />
                        )}
                        {msg.content && (
                          <div
                            className={`px-4 py-2 rounded-2xl text-sm ${isOwn ? "bg-primary-600 text-white rounded-br-sm" : "bg-dark-100 text-gray-100 rounded-bl-sm"}`}
                          >
                            {msg.content}
                          </div>
                        )}
                        <p
                          className={`text-xs text-gray-500 mt-1 ${isOwn ? "text-right" : "text-left"}`}
                        >
                          {format(new Date(msg.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span>{typingUsers[0]} is typing...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-white/5 bg-dark-100 flex gap-3"
            >
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleTyping}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="btn-primary px-4 py-2"
              >
                <FiSend />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <FiEdit className="w-16 h-16 mb-4 opacity-30" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Your Messages
            </h3>
            <p className="text-sm">Send a message to start a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
