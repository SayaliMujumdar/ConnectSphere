import { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiMessageCircle,
  FiBell,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { SocketContext } from "../context/SocketContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useContext(SocketContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/", icon: FiHome, label: "Home" },
    { to: "/search", icon: FiSearch, label: "Search" },
    { to: "/messages", icon: FiMessageCircle, label: "Messages" },
    {
      to: "/notifications",
      icon: FiBell,
      label: "Notifications",
      badge: unreadCount,
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-dark-100/90 backdrop-blur-md border-b border-white/5 flex items-center px-4">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
            <span className="text-sm font-bold text-white">CS</span>
          </div>
          <span className="hidden md:block text-lg font-bold text-white">
            ConnectSphere
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ to, icon: Icon, label, badge }) => (
            <Link
              key={to}
              to={to}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${location.pathname === to ? "text-white bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <Icon size={20} />
              <span className="hidden lg:block">{label}</span>
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <Link
            to={`/profile/${user?.username}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <img
              src={
                user?.profilePicture ||
                `https://ui-avatars.com/api/?name=${user?.username}&background=7e22ce&color=fff&size=64`
              }
              alt={user?.username}
              className="w-8 h-8 rounded-full"
            />
            <span className="hidden md:block text-sm font-medium text-gray-300">
              {user?.username}
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            title="Logout"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
