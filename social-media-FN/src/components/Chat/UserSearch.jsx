// src/components/Chat/UserSearch.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaTimes, FaUserPlus } from "react-icons/fa";
import { getAvatarColor, getInitials } from "../../utils/avatarHelper"; 
import { useAuth } from "../../context/AuthContext"; // ✅ NEW (to get current user)

const UserSearch = ({ onUserSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [showGroupPopup, setShowGroupPopup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showAddMembersList, setShowAddMembersList] = useState(false);
  const [showMore, setShowMore] = useState(false); // ✅ NEW

  const { user: currentUser } = useAuth(); // ✅ NEW
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await axios.get('https://main-tasks-backend.onrender.com/api/users/recent', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentChats(res.data);
      } catch (err) {
        console.error("Failed to fetch recent chats:", err);
      }
    };
    fetchRecent();
  }, [token]);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === '') {
      setResults([]);
      return;
    }

    try {
      const res = await axios.get(
        `https://main-tasks-backend.onrender.com/api/users/search?name=${value}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleSelectUser = async (selectedUser) => {
    const formattedUser = {
      type: "user",
      data: {
        _id: selectedUser._id,
        name: selectedUser.name,
        avatar: selectedUser.avatar || null
      }
    };

    onUserSelect(formattedUser);
    setResults([]);
    setQuery('');

    try {
      await axios.post(
        `https://main-tasks-backend.onrender.com/api/users/recent/${selectedUser._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRecentChats((prev) => {
        const exists = prev.find((c) => c.data._id === selectedUser._id);
        return exists ? prev : [formattedUser, ...prev].slice(0, 10);
      });
    } catch (err) {
      console.error("Failed to save recent chat:", err);
    }
  };

  const toggleMember = (user) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m._id === user._id)
        ? prev.filter((m) => m._id !== user._id)
        : [...prev, user]
    );
  };

  // ❌ Removed auto group name effect (it overwrote user input)

  const handleCreateGroup = async () => {
    if (!groupName || selectedMembers.length === 0)
      return alert("Group name & members required");

    try {
      const payload = {
        name: groupName,
        members: selectedMembers.map((u) => ({ user: u._id })),
        createdBy: currentUser?.id // ✅ NEW
      };

      const res = await axios.post("https://main-tasks-backend.onrender.com/api/group", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await axios.post(
        `https://main-tasks-backend.onrender.com/api/users/recent/${res.data._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Group created successfully");
      setRecentChats((prev) => [
        { type: "group", data: res.data },
        ...prev,
      ]);
      setShowGroupPopup(false);
      setGroupName('');
      setSelectedMembers([]);
      setShowAddMembersList(false);
      setShowMore(false); // ✅ NEW
    } catch (err) {
      console.error("Create group error:", err);
      alert("❌ Failed to create group");
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          className="w-full border border-gray-300 p-2 rounded-md"
          placeholder="Search users Name.."
        />
        <FaUsers
          className="text-blue-600 text-xl cursor-pointer hover:text-blue-800"
          onClick={() => setShowGroupPopup(true)}
        />
      </div>

      {showGroupPopup && (
        <div className="absolute top-14 right-0 w-96 bg-white border rounded-lg shadow-lg p-4 z-50">
          <FaTimes
            className="absolute top-2 right-2 text-gray-500 cursor-pointer hover:text-red-600"
            onClick={() => setShowGroupPopup(false)}
          />
          <h3 className="text-lg font-semibold mb-3">Create Group</h3>

          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center bg-blue-100 px-2 py-1 rounded-full"
                >
                  {member.name}
                  <FaTimes
                    className="ml-2 cursor-pointer text-red-500"
                    onClick={() => toggleMember(member)}
                  />
                </div>
              ))}
            </div>
          )}

          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="w-full border px-3 py-2 rounded-md mb-3"
          />

          <button
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-3"
            onClick={() => setShowAddMembersList((prev) => !prev)}
          >
            <FaUserPlus /> Add Members
          </button>

          {showAddMembersList && (
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 mb-3">
              {[...recentChats.filter(c => c.type === "user").map(c => c.data), ...results]
                .slice(0, showMore ? 20 : 5) // ✅ NEW limit
                .map((user) => (
                  <div
                    key={user._id}
                    className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 ${
                      selectedMembers.some((m) => m._id === user._id) ? "bg-blue-100" : ""
                    }`}
                    onClick={() => toggleMember(user)}
                  >
                    {user.name}
                  </div>
                ))}
              {(!showMore && results.length > 5) && (
                <button
                  onClick={() => setShowMore(true)} // ✅ NEW
                  className="text-blue-600 text-sm mt-2"
                >
                  View More
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleCreateGroup}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Create Group
          </button>
        </div>
      )}

      {recentChats.length > 0 && (
        <ul className="mt-2 border rounded-md">
          {recentChats.map((chat) => (
            <li
              key={chat.data._id}
              onClick={() =>
                onUserSelect({
                  type: chat.type,
                  data: chat.data,
                })
              }
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            >
              {chat.data.avatar ? (
                <img
                  src={`https://main-tasks-backend.onrender.com${chat.data.avatar}`}
                  alt={chat.data.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border border-gray-300"
                  style={{ backgroundColor: getAvatarColor(chat.data.name) }}
                >
                  {getInitials(chat.data.name)}
                </div>
              )}
              <span>{chat.data.name}</span>
              {chat.type === "group" && (
                <small className="text-xs bg-gray-200 px-2 py-1 rounded">Group</small>
              )}
            </li>
          ))}
        </ul>
      )}

      {results.length > 0 && (
        <ul className="mt-2 border rounded-md">
          {results.map((user) => (
            <li
              key={user._id}
              onClick={() => handleSelectUser(user)}
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            >
              {user.avatar ? (
                <img
                  src={`https://main-tasks-backend.onrender.com${user.avatar}`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border border-gray-300"
                  style={{ backgroundColor: getAvatarColor(user.name) }}
                >
                  {getInitials(user.name)}
                </div>
              )}
              <span>{user.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserSearch;
