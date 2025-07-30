import React, { useEffect, useState } from "react";
import { getInitials, getAvatarColor } from "../utils/avatarHelper";
import { formatTimeAgo } from "../utils/timeAgo";
import api from "../utils/api";

const Explore = () => {
  const [explorePosts, setExplorePosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [counts, setCounts] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [showMoreComments, setShowMoreComments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExplorePosts = async () => {
      try {
        const res = await api.get("/posts");
        const postData = res.data;

        const countsObj = {};
        const commentsObj = {};

        for (let post of postData) {
          const countRes = await api.get(`/posts/counts/${post._id}`);
          countsObj[post._id] = countRes.data;

          const commentRes = await api.get(`/posts/comments/${post._id}`);
          commentsObj[post._id] = commentRes.data.comments;
        }

        setExplorePosts(postData);
        setCounts(countsObj);
        setComments(commentsObj);
      } catch (err) {
        console.error("Failed to load explore posts:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExplorePosts();
  }, []);

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/like/${postId}`);
      const res = await api.get(`/posts/counts/${postId}`);
      setCounts((prev) => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error("Like error:", err.message);
    }
  };

  const handleComment = async (postId) => {
    try {
      const text = commentInputs[postId];
      if (!text) return;
      await api.post(`/posts/comment/${postId}`, { text });

      const countRes = await api.get(`/posts/counts/${postId}`);
      const commentRes = await api.get(`/posts/comments/${postId}`);

      setCounts((prev) => ({ ...prev, [postId]: countRes.data }));
      setComments((prev) => ({ ...prev, [postId]: commentRes.data.comments }));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Comment error:", err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-white p-4">
      <h1 className="text-2xl font-semibold mb-4">Explore</h1>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-[2px]">
        {explorePosts.map((post) => (
          <button
            key={post._id}
            onClick={() => setSelectedPost(post)}
            className="relative aspect-square overflow-hidden group"
          >
            {post.mediaType === "video" ? (
              <video
                src={post.mediaUrl}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                muted
                loop
                autoPlay
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt="Post"
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
              {post.mediaType === "video" ? "🎬" : "📷"}
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl overflow-hidden relative max-h-[95vh] overflow-y-auto">
            {/* Back Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setSelectedPost(null);
              }}
              className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded z-50"
            >
              Back
            </button>

            {/* Media */}
            {selectedPost.mediaType === "video" ? (
              <video
                src={selectedPost.mediaUrl}
                className="w-full h-[400px] object-cover"
                controls
                autoPlay
              />
            ) : (
              <img
                src={selectedPost.mediaUrl}
                className="w-full h-[400px] object-cover"
                alt="Post"
              />
            )}

            {/* Post Info */}
            <div className="p-4">
              <div className="flex items-center mb-4">
                {selectedPost.user?.avatar ? (
                  <img
                    src={`http://localhost:8000${selectedPost.user.avatar}`}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                    alt="Avatar"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white text-sm font-semibold"
                    style={{
                      backgroundColor: getAvatarColor(
                        selectedPost.user?.name || "User"
                      ),
                    }}
                  >
                    {getInitials(selectedPost.user?.name || "U")}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800">
                    {selectedPost.user?.name || "User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(selectedPost.createdAt)}
                  </p>
                </div>
              </div>

              {/* Text */}
              <p className="text-gray-700 mb-3">{selectedPost.text}</p>

              {/* Like & Comment Counts */}
              <div className="text-sm text-gray-600 flex gap-4 mb-4">
                <button onClick={() => handleLike(selectedPost._id)}>
                  ❤️ Likes: {counts[selectedPost._id]?.likesCount || 0}
                </button>
                <span>
                  💬 Comments: {counts[selectedPost._id]?.commentsCount || 0}
                </span>
              </div>

              {/* Comment Input */}
              <div className="flex mb-4">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 border px-3 py-1 rounded-l"
                  value={commentInputs[selectedPost._id] || ""}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({
                      ...prev,
                      [selectedPost._id]: e.target.value,
                    }))
                  }
                />
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded-r"
                  onClick={() => handleComment(selectedPost._id)}
                >
                  Post
                </button>
              </div>

              {/* Comments */}
              {comments[selectedPost._id]?.length > 0 && (
                <div className="space-y-2">
                  {(showMoreComments[selectedPost._id]
                    ? comments[selectedPost._id]
                    : comments[selectedPost._id].slice(0, 2)
                  ).map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-gray-100 rounded px-3 py-1 text-sm"
                    >
                      <strong>{comment.user?.name || "User"}:</strong>{" "}
                      {comment.text}
                    </div>
                  ))}
                  {comments[selectedPost._id].length > 2 && (
                    <button
                      className="text-blue-600 text-sm"
                      onClick={() =>
                        setShowMoreComments((prev) => ({
                          ...prev,
                          [selectedPost._id]: !prev[selectedPost._id],
                        }))
                      }
                    >
                      {showMoreComments[selectedPost._id]
                        ? "Show less"
                        : "Show more comments"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
