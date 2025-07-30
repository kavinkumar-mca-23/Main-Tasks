import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { io } from 'socket.io-client';

const FollowPage = ({ currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const token = localStorage.getItem('token');
  const socket = io('https://main-tasks-backend.onrender.com');

  useEffect(() => {
    fetchUsers();
    fetchFollowers();
    fetchFollowing();
    fetchPendingRequests();

    socket.on('new-follow-request', (data) => {
      if (data.to === currentUserId) {
        fetchPendingRequests();
      }
    });

    socket.on('follow-accepted', (data) => {
      if (data.to === currentUserId) {
        fetchFollowers();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 🔹 Fetch all users except current user
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const otherUsers = res.data.filter(user => user._id !== currentUserId);
      setUsers(otherUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // 🔹 Fetch followers
  const fetchFollowers = async () => {
    try {
      const res = await api.get(`/follow/followers/${currentUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFollowers(res.data);
    } catch (err) {
      console.error("Error fetching followers:", err);
    }
  };

  // 🔹 Fetch following
  const fetchFollowing = async () => {
    try {
      const res = await api.get(`/follow/following/${currentUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFollowing(res.data);
    } catch (err) {
      console.error("Error fetching following:", err);
    }
  };

  // 🔹 Fetch pending requests
  const fetchPendingRequests = async () => {
    try {
      const res = await api.get(`/follow/requests/${currentUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPendingRequests(res.data);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    }
  };

  // 🔹 Send follow request
  const sendFollowRequest = async (userId) => {
    try {
      await api.post(`/follow/${userId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchFollowing();
    } catch (err) {
      console.error("Error sending follow request:", err);
    }
  };

  // 🔹 Accept follow request
  const acceptFollowRequest = async (userId) => {
    try {
      await api.put(`/follow/accept/${userId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchFollowers();
      fetchPendingRequests();
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  return (
    <div>
      <h2>People You May Know</h2>
      <ul>
        {users.map(user => (
          <li key={user._id}>
            {user.name}
            <button onClick={() => sendFollowRequest(user._id)}>Follow</button>
          </li>
        ))}
      </ul>

      <h3>Followers</h3>
      <ul>
        {followers.map(follower => (
          <li key={follower._id}>{follower.name}</li>
        ))}
      </ul>

      <h3>Following</h3>
      <ul>
        {following.map(user => (
          <li key={user._id}>{user.name}</li>
        ))}
      </ul>

      <h3>Pending Requests</h3>
      <ul>
        {pendingRequests.map(req => (
          <li key={req._id}>
            {req.name}
            <button onClick={() => acceptFollowRequest(req._id)}>Accept</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FollowPage;
