import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { formatTimeAgo } from "../utils/timeAgo";
import { useNotification } from "../context/NotificationContext";

const getInitials = (name) => {
  return name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";
};

const getAvatarColor = (name) => {
  const colors = ["#FFB6C1", "#B19CD9", "#77DD77", "#FFD700", "#87CEFA"];
  let hash = 0;
  if (!name) name = "User";
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const UserProfile = () => {
  const { socket } = useNotification(); // get socket instance

  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [authUserId, setAuthUserId] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [followerList, setFollowerList] = useState([]); // added
  const [followingList, setFollowingList] = useState([]); // added
  const [showFollowers, setShowFollowers] = useState(false); // added
  const [showFollowing, setShowFollowing] = useState(false); // added



  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchData = async () => {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setAuthUserId(decoded.id);

        const userRes = await axios.get(`https://main-tasks-backend.onrender.com/api/auth/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);

        const postRes = await axios.get(`https://main-tasks-backend.onrender.com/api/posts/user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserPosts(postRes.data);

        const [followersRes, followingRes] = await Promise.all([
          axios.get(`https://main-tasks-backend.onrender.com/api/follow/followers/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`https://main-tasks-backend.onrender.com/api/follow/following/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setFollowersCount(followersRes.data.length);
        setFollowingCount(followingRes.data.length);

        const statusRes = await axios.get(`https://main-tasks-backend.onrender.com/api/follow/status/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(statusRes.data.isFollowing);
        setIsFollowedBy(statusRes.data.isFollowedBy);

        setErrorMsg("");
      } catch (error) {
        setErrorMsg(error?.response?.data?.message || "Error loading profile");
      }
    };

    fetchData();
  }, [id]);

  const handleFollowToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token || loadingFollow) return;

    setLoadingFollow(true);
    setErrorMsg("");

    try {
      if (isFollowing) {

        socket?.emit("send-notification", {
    receiverId: id,
    notification: {
      message: "unfollowed you",
      from: {
        _id: authUserId,
        name: user?.name,
        avatar: user?.avatar || "",
      },
      type: "unfollow",
    },
  });


        await axios.post(`https://main-tasks-backend.onrender.com/api/follow/unfollow/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);

        const statusRes = await axios.get(`https://main-tasks-backend.onrender.com/api/follow/status/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowedBy(statusRes.data.isFollowedBy);
      } else {

        const message = isFollowedBy ? "follow back, now you are mutual friends" : "started following you";
  const type = isFollowedBy ? "followBack" : "follow";

  socket?.emit("send-notification", {
    receiverId: id,
    notification: {
      message,
      from: {
        _id: authUserId,
        name: user?.name,
        avatar: user?.avatar || "",
      },
      type,
    },
  });



        await axios.post(`https://main-tasks-backend.onrender.com/api/follow/follow/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);

        const statusRes = await axios.get(`https://main-tasks-backend.onrender.com/api/follow/status/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowedBy(statusRes.data.isFollowedBy);
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Follow/unfollow error");
    } finally {
      setLoadingFollow(false);
    }
  };
const fetchFollowList = async (type) => {
  try {
    const token = localStorage.getItem("token");
    const url = type === "followers"
      ? `https://main-tasks-backend.onrender.com/api/follow/followers/${id}`
      : `https://main-tasks-backend.onrender.com/api/follow/following/${id}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // res.data is already populated with user info (name, avatar, etc.)
    const users = res.data.filter((profile) => {
      const isOwner = profile._id === authUserId;

     // Safely access followers and following
      const followers = Array.isArray(profile.followers) ? profile.followers : [];
      const following = Array.isArray(profile.following) ? profile.following : [];

      const isMutual = followers.includes(authUserId) && following.includes(authUserId);
      const isPublic = !profile.isPrivate

      return isOwner || isMutual || isPublic;
    });
    
  


    if (type === "followers") {
      setFollowerList(users);
      setShowFollowers(true);
      setShowFollowing(false);
    } else {
      setFollowingList(users);
      setShowFollowing(true);
      setShowFollowers(false);
    }
  } catch (err) {
    console.error("Error fetching list:", err);
  }
};

  if (!user) return <p className="text-center mt-10">Loading user profile...</p>;

 let showPosts = false;
if (user) {
  if (!user.isPrivate) {
    showPosts = true;
  } else {
    // Private: only mutual followers or owner can view posts
    showPosts = (isFollowing && isFollowedBy) || authUserId === id;
  }
}

// ...existing code...

let followBtnLabel = "Follow";
if (loadingFollow) followBtnLabel = "Loading...";
else if (isFollowing && isFollowedBy) followBtnLabel = "Mutual/Unfollow";
else if (isFollowing) followBtnLabel = "Unfollow";
else if (!isFollowing && isFollowedBy) followBtnLabel = "Follow Back";

// ...existing code...

  const disableFollowBtn = loadingFollow;

return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-8 md:px-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 w-full text-left">{user.name}'s Profile</h1>
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-6 md:p-10 flex flex-col gap-6">
        {errorMsg && <div className="text-red-600 text-center mb-4">{errorMsg}</div>}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative w-32 h-32">
            {user.avatar ? (
              <img
                src={`https://main-tasks-backend.onrender.com${user.avatar}`}
                alt="Avatar"
                className="rounded-full object-cover w-full h-full border-4 border-gray-200"
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-semibold"
                style={{ backgroundColor: getAvatarColor(user.name) }}
              >
                {getInitials(user.name)}
              </div>
            )}
          </div>
          <div className="flex-1 w-full">
            <div className="mb-2">
              <label className="block text-gray-600 font-medium mb-1">Name</label>
              <p className="text-gray-900">{user.name}</p>
            </div>
            <div className="mb-2">
              <label className="block text-gray-600 font-medium mb-1">Bio</label>
              <p className="text-gray-700">{user.bio || "No bio available."}</p>
            </div>
            <div className="flex gap-6 mt-3 text-sm text-gray-700">
              <span><strong>{userPosts.length}</strong> Posts</span>
              <span className="cursor-pointer hover:underline" onClick={() => fetchFollowList("followers")}>{followersCount} Followers</span>
              <span className="cursor-pointer hover:underline" onClick={() => fetchFollowList("following")}>{followingCount} Following</span>
            </div>
            {user._id !== authUserId && (
              <div>
                <button
                  onClick={handleFollowToggle}
                  className={`px-4 py-2 rounded mt-4 ${isFollowing ? "bg-red-500" : "bg-blue-600"} text-white`}
                  disabled={disableFollowBtn}
                >
                  {followBtnLabel}
                </button>
              </div>
            )}
          </div>
        </div>
     {/* followeres/ following list */}
        {showFollowers && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Followers</h3>
            {followerList.map(user => (
              <div key={user._id} className="cursor-pointer flex items-center gap-4 p-3 bg-gray-100 rounded hover:bg-gray-200" onClick={() => navigate(`/user/${user._id}`)}>
                {user.avatar ? (
                  <img src={`https://main-tasks-backend.onrender.com${user.avatar}`} className="w-10 h-10 rounded-full object-cover" alt={user.name} />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: getAvatarColor(user.name) }}>
                    {getInitials(user.name)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{user.name}</p>
                  {/* <p className="text-sm text-gray-600">{user.bio || "No bio"}</p> */}
                </div>
              </div>
            ))}
            <button onClick={() => setShowFollowers(false)} className="mt-4 text-blue-600 underline">Close</button>
          </div>
        )}

        {showFollowing && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Following</h3>
            {followingList.map(user => (
              <div key={user._id} className="cursor-pointer flex items-center gap-4 p-3 bg-gray-100 rounded hover:bg-gray-200" onClick={() => navigate(`/user/${user._id}`)}>
                {user.avatar ? (
                  <img src={`https://main-tasks-backend.onrender.com${user.avatar}`} className="w-10 h-10 rounded-full object-cover" alt={user.name} />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: getAvatarColor(user.name) }}>
                    {getInitials(user.name)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{user.name}</p>
                  {/* <p className="text-sm text-gray-600">{user.bio || "No bio"}</p> */}
                </div>
              </div>
            ))}
            <button onClick={() => setShowFollowing(false)} className="mt-4 text-blue-600 underline">Close</button>
          </div>
        )}


{/* show post */}

        {showPosts && (
          <div className="mt-6 w-full">
            <div className="flex justify-center gap-8 mb-4">
              <button
                onClick={() => setMediaFilter("all")}
                className={`py-2 px-4 rounded ${mediaFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
              >
                📋 All Posts
              </button>
              <button
                onClick={() => setMediaFilter("image")}
                className={`py-2 px-4 rounded ${mediaFilter === "image" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
              >
                🖼️ Image Posts
              </button>
              <button
                onClick={() => setMediaFilter("video")}
                className={`py-2 px-4 rounded ${mediaFilter === "video" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
              >
                🎥 Video Posts
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userPosts
                .filter(post => mediaFilter === "all" || post.mediaType === mediaFilter)
                .map(post => (
                  <div key={post._id} className="w-full aspect-square relative group">
                    {post.mediaType === "video" ? (
                      <video src={post.mediaUrl} className="w-full h-full object-cover rounded-xl" controls muted />
                    ) : (
                      <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover rounded-xl" />
                    )}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {formatTimeAgo(post.createdAt)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        {!showPosts && user.isPrivate && authUserId !== id && (
          <div className="mt-6 text-center text-orange-600">
            This account is private. Only mutulfollow can view posts.
          </div>
        )}
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mt-6">
          ← Back
        </button>
      </div>
    </div>
  );
};



export default UserProfile;
