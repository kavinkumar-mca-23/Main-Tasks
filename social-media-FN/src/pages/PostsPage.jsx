import React from 'react';
import PostList from '../components/posts/PostList';

const PostsPage = () => {
  return (
    <div className="ml-64 p-6">
      <h2 className="text-2xl font-bold mb-6">All Posts</h2>
      <PostList />
    </div>
  );
};

export default PostsPage;
