import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiMessageCircle,
  FiBell,
  FiUser,
  FiLogOut,
  FiCompass,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

export default function LeftSidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useContext(SocketContext);
  const navigate = useNavigate();

  const links = [
    { to: "/", icon: FiHome, label: "Home" },
    { to: "/search", icon: FiSearch, label: "Search" },
    { to: "/messages", icon: FiMessageCircle, label: "Messages", badge: 0 },
    {
      to: "/notifications",
      icon: FiBell,
      label: "Notifications",
      badge: unreadCount,
    },
    { to: `/profile/${user?.username}`, icon: FiUser, label: "Profile" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 sticky top-20 h-fit py-4 space-y-1">
      {links.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <div className="relative">
            <Icon size={20} />
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </div>
          <span className="font-medium">{label}</span>
        </NavLink>
      ))}
      <hr className="border-white/10 my-2" />
      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="nav-item text-left w-full hover:text-red-400"
      >
        <FiLogOut size={20} />
        <span className="font-medium">Logout</span>
      </button>
    </aside>
  );
}
