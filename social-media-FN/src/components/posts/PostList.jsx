import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const PostList = () => {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div>
      {posts.map((post) => (
        <div key={post._id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <p>{post.text}</p>
          {post.mediaUrl && (
  post.mediaType === "video" ? (
    <video controls className="w-full max-h-96 rounded-xl mb-2">
      <source src={post.mediaUrl} type="video/mp4" />
    </video>
  ) : (
    <img
      src={post.mediaUrl}
      alt="Post media"
      className="w-full rounded-xl mb-2"
    />
  )
)}

        </div>
      ))}
    </div>
  );
};

export default PostList;
