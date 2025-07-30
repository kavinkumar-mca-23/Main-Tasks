import React, { useState } from "react";
import MessageDrawer from "../components/Chat/MessageDrawer";
import ChatWindow from "../components/Chat/ChatWindow";
import { useAuth } from "../context/AuthContext";
// import socket from "../utils/socket";

const MessagesPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { token} = useAuth();
  
  //initialize sokect connection
  // useEffect(() => {
  //   if (user?._id) {
  //     socket.connect();
  //     socket.emit("user_online", user._id);
  //   }

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, [user]);


  return (
    <div className="flex h-screen relative overflow-hidden md:ml-64">
      {/* Main Chat Window */}
      <div className="flex-1 p-4">
        {selectedUser ? (
          <ChatWindow user={selectedUser} />
        ) : (
          <div className="text-gray-400 text-center mt-10">
            Select a user to start chatting
          </div>
        )}
      </div>

      {/* Drawer background overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Message Drawer */}
{/* Message Drawer */}
      <MessageDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelectUser={(chat) => {
          setSelectedUser(chat);
          setDrawerOpen(false);
        }}
        token={token}
      />

      {/* Floating Chat Button */}
      <button
        className="fixed bottom-6 right-6 md:right-72 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 z-50"
        onClick={() => setDrawerOpen(true)}
      >
        💬 Messages
      </button>
    </div>
  );
};

export default MessagesPage;