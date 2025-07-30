// src/components/posts/PostForm.jsx
import React, { useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const PostForm = () => {
  const [text, setText] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false); // add this state

  const navigate = useNavigate();

  
  const { socket} = useNotification();

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    setMedia(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
    } else {
      setMediaPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // start spinner

    const formData = new FormData();
    formData.append('text', text);
    if (media) formData.append('media', media);

    try {
      setStatusMessage('Uploading...');
      const response = await api.post('/posts', formData);
      console.log('Post created:', response.data);
      setStatusMessage('✅ Post created successfully!');
      setText('');
      setMedia(null);
      setMediaPreview('');
      const newPost = response.data;
      socket?.emit('newPost', newPost);
      setTimeout(() => {
         setLoading(false);
        navigate('/home'); // redirect after post
      }, 1000);
    } catch (error) {
      console.error('Post creation failed:', error.response?.data || error.message);
      setStatusMessage('❌ Post creation failed!');
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Create Post</h2>
      {loading && (
      <div className="fixed inset-0 bg-white bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-dotted rounded-full animate-spin" />
      </div>
     )}

      {statusMessage && (
        <div className="mb-4 text-sm text-blue-700 font-medium">{statusMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full border border-gray-300 p-2 rounded"
          rows={4}
          required
        />
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaChange}
        />

        {mediaPreview && (
          <div className="mt-2">
            {media?.type.startsWith('video') ? (
              <video src={mediaPreview} controls className="w-full max-h-64 rounded" />
            ) : (
              <img src={mediaPreview} alt="preview" className="w-full max-h-64 rounded object-cover" />
            )}
          </div>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Post
        </button>
      </form>
    </div>
  );
};

export default PostForm;
