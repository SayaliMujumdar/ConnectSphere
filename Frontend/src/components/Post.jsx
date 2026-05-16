import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiMoreHorizontal,
  FiTrash2,
  FiBookmark,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function Post({ post: initialPost, onDeleted, onUpdated }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const isLiked = post.likes?.includes(user?._id);
  const isOwn = post.author?._id === user?._id || post.author === user?._id;

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    // Optimistic update
    const wasLiked = post.likes?.includes(user._id);
    setPost((prev) => ({
      ...prev,
      likes: wasLiked
        ? prev.likes.filter((id) => id !== user._id)
        : [...(prev.likes || []), user._id],
    }));
    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      setPost((prev) => ({ ...prev, likes: data.likes }));
    } catch {
      // Revert on failure
      setPost((prev) => ({
        ...prev,
        likes: wasLiked
          ? [...(prev.likes || []), user._id]
          : prev.likes.filter((id) => id !== user._id),
      }));
      toast.error("Action failed");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentLoading(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, {
        text: comment.trim(),
      });
      setPost((prev) => ({ ...prev, comments: data.comments }));
      setComment("");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onDeleted(post._id);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleShare = async () => {
    try {
      const { data } = await api.post(`/posts/${post._id}/share`);
      onUpdated &&
        onUpdated({ ...post, shareCount: (post.shareCount || 0) + 1 });
      toast.success("Post shared to your profile!");
    } catch {
      toast.error("Failed to share post");
    }
  };

  const authorObj =
    typeof post.author === "object"
      ? post.author
      : { _id: post.author, username: "Unknown" };

  return (
    <article className="card p-4 hover:border-white/10 transition-colors">
      {/* Shared post indicator */}
      {post.sharedFrom && (
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <FiShare2 size={12} /> Shared a post
        </p>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${authorObj.username}`}>
            <img
              src={
                authorObj.profilePicture ||
                `https://ui-avatars.com/api/?name=${authorObj.username}&background=7e22ce&color=fff`
              }
              alt={authorObj.username}
              className="w-11 h-11 rounded-full"
            />
          </Link>
          <div>
            <Link
              to={`/profile/${authorObj.username}`}
              className="font-semibold text-white hover:text-primary-400 transition-colors"
            >
              @{authorObj.username}
              {authorObj.isVerified && (
                <span className="ml-1 text-primary-400 text-xs">✓</span>
              )}
            </Link>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>

        {isOwn && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <FiMoreHorizontal />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-dark-300 border border-white/10 rounded-xl shadow-xl overflow-hidden z-10 min-w-[140px]">
                <button
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <FiTrash2 size={14} /> Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-gray-200 mb-3 leading-relaxed whitespace-pre-wrap">
          {post.content.split(" ").map((word, i) =>
            word.startsWith("#") ? (
              <Link
                key={i}
                to={`/search?q=${word}`}
                className="text-primary-400 hover:underline"
              >
                {word}{" "}
              </Link>
            ) : word.startsWith("@") ? (
              <Link
                key={i}
                to={`/profile/${word.slice(1)}`}
                className="text-primary-300 hover:underline"
              >
                {word}{" "}
              </Link>
            ) : (
              `${word} `
            ),
          )}
        </p>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div
          className={`grid gap-2 mb-3 rounded-xl overflow-hidden ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {post.media.map((m, i) =>
            m.type === "video" ? (
              <video
                key={i}
                src={m.url}
                controls
                className="w-full rounded-xl max-h-96 object-cover"
              />
            ) : (
              <img
                key={i}
                src={m.url}
                alt=""
                className="w-full rounded-xl max-h-96 object-cover"
              />
            ),
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-white/5">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-pink-500/10 ${isLiked ? "text-pink-500" : "text-gray-400 hover:text-pink-400"}`}
        >
          <FiHeart className={isLiked ? "fill-current" : ""} size={18} />
          <span>{post.likes?.length || 0}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
        >
          <FiMessageCircle size={18} />
          <span>{post.comments?.length || 0}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-green-400 hover:bg-green-400/10 transition-all"
        >
          <FiShare2 size={18} />
          <span>{post.shareCount || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
          {post.comments?.map((c) => (
            <div key={c._id} className="flex gap-3">
              <Link to={`/profile/${c.user?.username}`}>
                <img
                  src={
                    c.user?.profilePicture ||
                    `https://ui-avatars.com/api/?name=${c.user?.username}&background=7e22ce&color=fff`
                  }
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  alt=""
                />
              </Link>
              <div className="flex-1">
                <div className="bg-dark-300 rounded-2xl rounded-tl-sm px-3 py-2">
                  <Link
                    to={`/profile/${c.user?.username}`}
                    className="text-xs font-semibold text-white"
                  >
                    @{c.user?.username}
                  </Link>
                  <p className="text-sm text-gray-300 mt-0.5">{c.text}</p>
                </div>
                <p className="text-xs text-gray-600 mt-1 ml-3">
                  {formatDistanceToNow(new Date(c.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}

          <form onSubmit={handleComment} className="flex gap-2 mt-2">
            <img
              src={
                user?.profilePicture ||
                `https://ui-avatars.com/api/?name=${user?.username}&background=7e22ce&color=fff`
              }
              className="w-8 h-8 rounded-full flex-shrink-0"
              alt=""
            />
            <input
              type="text"
              className="input-field text-sm py-2 flex-1"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={commentLoading || !comment.trim()}
              className="btn-primary px-4 py-2 text-sm"
            >
              {commentLoading ? "..." : "Post"}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
