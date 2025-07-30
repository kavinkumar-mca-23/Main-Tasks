import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getInitials,getAvatarColor } from '../utils/avatarHelper';




const SuggestedUsers = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://main-tasks-backend.onrender.com/api/follow/suggested', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      }
    };

    fetchSuggestedUsers();
  }, []);

  return (
    <div style={{ padding: '300px', marginBottom: '400px',  }}>
      <h2>Suggested Users</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map(user => (
          <li
            key={user._id}
            onClick={() => navigate(`/user/${user._id}`)}
            className="cursor-pointer hover:bg-gray-100 p-2 rounded"
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: '1px solid #ccc',
              paddingBottom: '10px'
            }}
          >
            
            {user.avatar ? (
            <img
             
            src={`https://main-tasks-backend.onrender.com${user.avatar}`}
              alt={user.name}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid #ddd'
              }}
            />
            ) :(
              <div
               style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: getAvatarColor(user.name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                border: '1px solid #ddd'
           }}
            >
             {getInitials(user.name)}
           </div>
      )}
            <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>{user.name}</span>
            {user.isPrivate && <span style={{ marginLeft: '5px' }}>🔒Private</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestedUsers;
