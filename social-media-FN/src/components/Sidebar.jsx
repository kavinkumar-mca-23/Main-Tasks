import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaHome,
  FaUser,
  FaEnvelope,
  FaBell,
  FaSignOutAlt,
  FaPen,
  FaUsers,
  FaUserPlus,
  FaCompass,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import NotificationBell from "../components/NotificationBell";

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Hamburger icon for mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-700 text-2xl p-2 bg-white shadow rounded-full"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-md p-6 transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:block`}
      >
        <h1 className="text-2xl font-bold text-blue-600 mb-10">Connections</h1>
        <nav className="flex flex-col space-y-6 text-gray-700">
          <Link to="/home" className="flex items-center space-x-2 hover:text-blue-600">
            <FaHome />
            <span>Home</span>
          </Link>
          <Link to="/profile" className="flex items-center space-x-2 hover:text-blue-600">
            <FaUser />
            <span>Profile</span>
          </Link>
          <Link to="/suggested" className="flex items-center space-x-2 hover:text-blue-600">
            <FaUserPlus />
            <span>Suggested Users</span>
          </Link>
          <Link to="/create-post" className="flex items-center space-x-2 hover:text-blue-600">
            <FaPen />
            <span>Create Post</span>
          </Link>
           
          <Link to="/explore" className="flex items-center space-x-2 hover:text-blue-600">
            <FaCompass />
            <span>Explore</span>
          </Link>
          
          <Link to="/messages" className="flex items-center space-x-2 hover:text-blue-600">
            <FaEnvelope />
            <span>Messages</span>
          </Link>
          {/* <Link to="/groups" className="flex items-center space-x-2 hover:text-blue-600">
            <FaEnvelope />
            <span>Groups</span>
          </Link> */}
          <div
            className="flex items-center space-x-2 hover:text-blue-600 cursor-pointer"
            onClick={() => {
              navigate("/notifications");
              setIsOpen(false); // close on mobile
            }}
          >
            <NotificationBell onOpen={() => navigate("/notifications")} />
            <span>Notifications</span>
          </div>
         
          {/* <Link to="/follow" className="flex items-center space-x-2 hover:text-blue-600">
            <FaUsers />
            <span>Follow</span>
          </Link>
          <Link to="/followers" className="flex items-center space-x-2 hover:text-blue-600">
            <FaUsers />
            <span>Followers</span>
          </Link> */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-500 hover:text-red-700"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
