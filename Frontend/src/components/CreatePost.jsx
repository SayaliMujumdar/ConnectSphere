import { useState, useRef } from "react";
import {
  FiImage,
  FiVideo,
  FiX,
  FiGlobe,
  FiLock,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", icon: FiGlobe },
  { value: "followers", label: "Followers", icon: FiUsers },
  { value: "private", label: "Only Me", icon: FiLock },
];

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 10) {
      toast.error("Max 10 files per post");
      return;
    }
    setMediaFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [
          ...prev,
          {
            url: ev.target.result,
            type: file.type.startsWith("video") ? "video" : "image",
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error("Please add some content or media");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("visibility", visibility);
      mediaFiles.forEach((file) => formData.append("media", file));

      const { data } = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setContent("");
      setMediaFiles([]);
      setPreviews([]);
      onPostCreated(data.post);
      toast.success("Post created!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const VisibilityIcon =
    VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.icon || FiGlobe;

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <img
          src={
            user?.profilePicture ||
            `https://ui-avatars.com/api/?name=${user?.username}&background=7e22ce&color=fff`
          }
          className="w-11 h-11 rounded-full flex-shrink-0"
          alt=""
        />
        <div className="flex-1">
          <textarea
            className="w-full bg-transparent text-gray-200 placeholder-gray-500 resize-none text-base focus:outline-none min-h-[80px]"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
          />

          {/* Media Previews */}
          {previews.length > 0 && (
            <div
              className={`grid gap-2 mt-3 ${previews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
            >
              {previews.map((p, i) => (
                <div
                  key={i}
                  className="relative rounded-xl overflow-hidden bg-dark-300 aspect-video"
                >
                  {p.type === "video" ? (
                    <video src={p.url} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={p.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-primary-400/10"
              >
                <FiImage size={18} />
                <span className="hidden sm:block">Photo</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              {/* Visibility */}
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="text-sm bg-dark-300 border border-white/10 text-gray-400 rounded-lg px-2 py-1 focus:outline-none focus:border-primary-500"
              >
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <span
                  className={`text-xs ${content.length > 1900 ? "text-red-400" : "text-gray-500"}`}
                >
                  {2000 - content.length}
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={
                  loading || (!content.trim() && mediaFiles.length === 0)
                }
                className="btn-primary py-1.5 px-5 text-sm"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
