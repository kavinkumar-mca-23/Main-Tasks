// ✅ src/components/Chat/MessageDrawer.jsx (Cleaned)
import React from "react";
import { FaTimes } from "react-icons/fa";
import UserSearch from "./UserSearch"; // ✅ Import updated UserSearch

const MessageDrawer = ({ isOpen, onClose, onSelectUser, token }) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-full md:w-[calc(100%-16rem)] max-w-md bg-white shadow-lg p-4 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Messages</h2>
        <FaTimes className="cursor-pointer" onClick={onClose} />
      </div>

      {/* 🔍 User Search (handles recent chats internally) */}
      <UserSearch token={token} onUserSelect={(chat) => {
        onSelectUser(chat);
        onClose();
      }} />
    </div>
  );
};

export default MessageDrawer;
