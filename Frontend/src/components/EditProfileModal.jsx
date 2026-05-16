import { useState, useRef } from "react";
import { FiX, FiCamera, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

export default function EditProfileModal({ profile, onClose, onUpdated }) {
  const [form, setForm] = useState({
    username: profile.username || "",
    bio: profile.bio || "",
    website: profile.website || "",
    location: profile.location || "",
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const profilePicRef = useRef();
  const coverPhotoRef = useRef();

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (type === "profile") {
        setProfilePicFile(file);
        setProfilePicPreview(ev.target.result);
      } else {
        setCoverPhotoFile(file);
        setCoverPhotoPreview(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (profilePicFile) formData.append("profilePicture", profilePicFile);
      if (coverPhotoFile) formData.append("coverPhoto", coverPhotoFile);

      const { data } = await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpdated(data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cover Photo
            </label>
            <div
              className="relative h-28 bg-gradient-to-r from-primary-900 to-primary-700 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              style={
                coverPhotoPreview
                  ? {
                      backgroundImage: `url(${coverPhotoPreview})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : profile.coverPhoto
                    ? {
                        backgroundImage: `url(${profile.coverPhoto})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
              }
              onClick={() => coverPhotoRef.current?.click()}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <FiCamera className="text-white text-2xl" />
              </div>
              <input
                ref={coverPhotoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "cover")}
              />
            </div>
          </div>

          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div
                className="relative cursor-pointer"
                onClick={() => profilePicRef.current?.click()}
              >
                <img
                  src={
                    profilePicPreview ||
                    profile.profilePicture ||
                    `https://ui-avatars.com/api/?name=${profile.username}&background=7e22ce&color=fff&size=128`
                  }
                  className="w-20 h-20 rounded-full object-cover"
                  alt=""
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <FiCamera className="text-white" />
                </div>
                <input
                  ref={profilePicRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "profile")}
                />
              </div>
              <span className="text-sm text-gray-400">Click to change</span>
            </div>
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              className="input-field"
              value={form.username}
              onChange={(e) =>
                setForm({
                  ...form,
                  username: e.target.value.toLowerCase().replace(/\s/g, ""),
                })
              }
              minLength={3}
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Tell people about yourself..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {form.bio.length}/160
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://yourwebsite.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="New York, USA"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
