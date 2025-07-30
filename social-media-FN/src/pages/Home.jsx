import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import baseURL from "../utils/api";
import { formatTimeAgo } from "../utils/timeAgo";
import { getInitials,getAvatarColor }  from "../utils/avatarHelper";
import io from "socket.io-client"
import api from "../utils/api";


const Home = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [counts, setCounts] = useState({});
  // const [comments, setComments] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  // const [replyInput, setReplyInput] = useState({});
  // const [showAllComments, setShowAllComments] = useState(false);
  const [allPostComments, setAllPostComments] = useState({});
 const [showMoreComments, setShowMoreComments] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    let socket;
    const fetchProfileAndPosts = async () => {
      try {
        const token = localStorage.getItem("token");

   const profileRes = await baseURL.get("/auth/me", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

setUser(profileRes.data);

// Fetch all posts
const allPostsRes = await baseURL.get("/posts");

// 🔁 Filter only posts from followed users
const followingIds = profileRes.data.following || [];
const filteredPosts = allPostsRes.data.filter(post => 
  followingIds.includes(post.user?._id) || post.user?._id === profileRes.data._id
);
setPosts(filteredPosts);

// ✅ Then continue with userPosts and counts
const userPostRes = await baseURL.get(`/posts/user/${profileRes.data._id}`, {
  headers: { Authorization: `Bearer ${token}` },
});
setUserPosts(userPostRes.data);

// Counts and comments fetching...

        
         // Fetch like/comment counts for each post
        const countsObj = {};
        const commentsObj = {};
        for (let post of allPostsRes.data) {
        const countRes = await api.get(`/posts/counts/${post._id}`);
        countsObj[post._id] = countRes.data;
          
        // 👇 Fetch comments per post
        const commentRes = await api.get(`/posts/comments/${post._id}`);
        commentsObj[post._id] = commentRes.data.comments;

      }
      setCounts(countsObj);
       setAllPostComments(commentsObj);

      

      // 👇 Socket connect (AFTER user is fetched)
      if (userId) {
        socket = io("https://main-tasks-backend.onrender.com", {
          query: { userId },
        });

        socket.on("connect", () => {
          console.log("🔌 Connected to socket server");
        });

        socket.on("newNotification", (data) => {
          console.log("🔔 New notification received", data);
          // Optional: you can update UI or show toast here
        });
      }

      } catch (error) {
        console.error("Error loading data", error);
      }
    };

   

    fetchProfileAndPosts();
  }, []);

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/like/${postId}`);
      const res = await api.get(`/posts/counts/${postId}`);
      setCounts((prev) => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const handleComment = async (postId) => {
    try {
      const text = commentInputs[postId];
      if (!text) return;
     // ✅ Post the comment 
      await api.post(`/posts/comment/${postId}`, { text });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
     
      // ✅ Refresh like/comment counts
      const res = await api.get(`/posts/counts/${postId}`);
      setCounts((prev) => ({ ...prev, [postId]: res.data }));
      
      // ✅ Refresh comments for the post
    const commentsRes = await api.get(`/posts/comments/${postId}`);
    setAllPostComments((prev) => ({
      ...prev,
      [postId]: commentsRes.data.comments,
    }));
   
    } catch (err) {
      console.error("Failed to comment on post:", err);
    }
  };

   



  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="flex flex-col md:flex-row relative min-h-screen">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 sm:p-6 md:p-10 bg-gray-100 min-h-screen">
        {/* Profile section */}
        {user && (
          <div
            onClick={handleProfileClick}
            className="absolute top-4 right-4 sm:top-6 sm:right-8 md:right-10 flex items-center bg-white rounded-full shadow-md px-3 py-2 cursor-pointer hover:shadow-lg transition-all z-10"
          >
            {user.avatar ?(
            <img
              src={
                
                  `https://main-tasks-backend.onrender.com${user.avatar}`}
                   alt="Profile"
                   className="w-10 h-10 rounded-full object-cover mr-2"
            />
              ):(
                <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mr-2 text-white text-sm font-semibold"
                style={{ backgroundColor: getAvatarColor(user.name) }}
              >
                {getInitials(user.name)}
                 
                </div>

              )}    

            <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
              {user.name}
            </p>
          </div>
        )}

   {/* All Posts Section */}
<section>
  <h2 className="text-2xl font-bold mb-4 text-blue-700">Filterd posts from followed users</h2>
  <div className="grid gap-6">
    {posts.map((post) => (
      <div key={post._id} className="bg-white rounded-xl shadow mx-auto w-full max-w-md overflow-hidden">
        {/* User Info */}
        <div className="flex items-center mb-3">
    
    {post.user?.avatar ?(  
        <img
        src={ `https://main-tasks-backend.onrender.com${post.user.avatar}`}
        alt="avatar"
        className="w-10 h-10 rounded-full object-cover mr-3"
        />
      )  :(
        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white text-sm font-semibold"
        style={{ backgroundColor: getAvatarColor(post.user?.name) }}
        >
          {getInitials(post.user?.name)}
        </div>
      )}
  <div>
    <p className="font-semibold text-gray-800">{post.user?.name || "Unknown"}</p>
    <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
  </div>
</div>


        {/* Media Preview */}
        {post.mediaUrl && (
          post.mediaType === "video" ? (
            <video controls className="w-full max-h-96 rounded-xl mb-2">
              <source src={post.mediaUrl} type="video/mp4" />
            </video>
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="w-full aspect-[4/5] object-cover rounded-xl"
            />
          )
        )}

        {/* Text */}
        <p className="text-gray-800">{post.text}</p>
        
        {/* Like + Comment Counts */}
            <div className="flex items-center gap-4 text-sm mb-2">
              <button onClick={() => handleLike(post._id)}>
                ❤️ Like ({counts[post._id]?.likesCount || 0})
              </button>
              <span>💬 Comments: {counts[post._id]?.commentsCount || 0}</span>
            </div>

               {/* Comment Input */}
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1 mr-2"
                value={commentInputs[post._id] || ""}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [post._id]: e.target.value,
                  }))
                }
              />
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg"
                onClick={() => handleComment(post._id)}
              >
                Post
              </button>
            </div>
            {/* Comments Section */}
{allPostComments[post._id]?.length > 0 && (
  <div className="mt-3">
    <div className="max-h-48 overflow-y-auto space-y-2 border-t pt-2">
      {(showMoreComments[post._id]
        ? allPostComments[post._id]
        : allPostComments[post._id].slice(0, 2)
      ).map((comment) => (
        <div key={comment._id} className="text-sm text-gray-700 bg-gray-100 rounded px-3 py-1">
          <strong>{comment.user?.name || "User"}:</strong> {comment.text}
        </div>
      ))}
    </div>

    {/* Toggle Button */}
    {allPostComments[post._id].length > 2 && (
      <button
        className="text-blue-500 text-sm mt-1"
        onClick={() =>
          setShowMoreComments((prev) => ({
            ...prev,
            [post._id]: !prev[post._id],
          }))
        }
      >
        {showMoreComments[post._id] ? "Show less" : "Show more comments"}
      </button>
    )}
  </div>
)}


      </div>
    ))}
  </div>
</section>

{/* My Posts Section */}
{userPosts.length > 0 ? (
  <section className="mt-10">
    <h2 className="text-2xl font-bold mb-4 text-green-700">My Posts</h2>
    <div className="grid gap-6">
      {userPosts.map((post) => (
        <div key={post._id} className="bg-white rounded-xl shadow mx-auto w-full max-w-md overflow-hidden">
          {/* User Info */}
          <div className="flex items-center mb-3 p-4">
            {user?.avatar ? (
              <img
                src={`https://main-tasks-backend.onrender.com${user.avatar}`}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover mr-3"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white text-sm font-semibold"
                style={{ backgroundColor: getAvatarColor(user.name) }}
              >
                {getInitials(user.name)}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
            </div>
          </div>

          {/* Media */}
          {post.mediaUrl && (
            post.mediaType === "video" ? (
              <video controls className="w-full max-h-96 rounded-xl mb-2">
                <source src={post.mediaUrl} type="video/mp4" />
              </video>
            ) : (
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="w-full object-cover aspect-[4/5]"
              />
            )
          )}

          {/* Text */}
          <p className="text-gray-800 px-4">{post.text}</p>

          {/* Like + Comment Counts */}
          <div className="flex items-center gap-4 text-sm mb-4 mt-2 px-4">
            <span>❤️ Likes: {counts[post._id]?.likesCount || 0}</span>
            <span>💬 Comments: {counts[post._id]?.commentsCount || 0}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
) : (
  <p className="text-center text-gray-500 mt-10">You haven't posted anything yet.</p>
)}

   
   
      </main>
    </div>
  );
};

export default Home;
