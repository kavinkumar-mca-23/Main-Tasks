import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { gsap } from "gsap";
import { formatTimeAgo } from "../utils/timeAgo";


const getInitials = (name) => {
  return name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";
};

const getAvatarColor = (name) => {
  const colors = ["#FFB6C1", "#B19CD9", "#77DD77", "#FFD700", "#87CEFA"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const Profile = () => {
  const { user, loadUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", bio: "",isPrivate: false });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [mediaFilter, setMediaFilter] = useState("all");
  const successRef = useRef(null);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const [followerList, setFollowerList] = useState([]); // added
  const [followingList, setFollowingList] = useState([]); // added
  const [showFollowers, setShowFollowers] = useState(false); // added
  const [showFollowing, setShowFollowing] = useState(false); // added

// followers and following count 

useEffect(() => {
  const fetchFollowCounts = async () => {
    if (!user?._id) return;

    const token = localStorage.getItem("token");
    try {
      const [followersRes, followingRes] = await Promise.all([
        api.get(`/follow/followers/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/follow/following/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setFollowersCount(followersRes.data.length);
      setFollowingCount(followingRes.data.length);
    } catch (err) {
      console.error("❌ Error fetching follow counts", err);
    }
  };

  fetchFollowCounts();
}, [user]);




  //my  post 
  useEffect(() => {
  if (user?._id) {
    api.get(`/posts/user/${user._id}`)
      .then(res => setMyPosts(res.data))
      .catch(err => console.error("Failed to fetch posts", err));
  }
}, [user]);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, bio: user.bio || "", isPrivate: user.isPrivate || false });
      setPreview(user.avatar ? `http://localhost:8000${user.avatar}` : null);
    }
  }, [user]);

  useEffect(() => {
    if (isLoading) {
      gsap.fromTo(
        ".saving-text",
        { opacity: 0 },
        { opacity: 1, duration: 1, repeat: -1, yoyo: true }
      );
    } else {
      gsap.killTweensOf(".saving-text");
    }
  }, [isLoading]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 300,
        useWebWorker: true,
      });

       const fixedFile = new File([compressed], file.name, { type: file.type });

        setAvatarFile(fixedFile);
    setPreview(URL.createObjectURL(fixedFile));
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);

    setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("bio", form.bio);
        formData.append("isPrivate", form.isPrivate); // ✅ SEND this
        if (avatarFile) formData.append("avatar", avatarFile);

        await api.put("/auth/me", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        await loadUser();
        setIsEditing(false);
        setAvatarFile(null);
        setIsLoading(false);

        // Animate success message
        if (successRef.current) {
          gsap.fromTo(
            successRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
          );
        }
      } catch (err) {
        console.error("Update failed", err);
        alert("Failed to update profile.");
        setIsLoading(false);
      }
    }, 2000);
  };

  const handleCancelEdit = () => {
    setForm({ name: user.name, bio: user.bio || "" });
    setPreview(user.avatar ? `http://localhost:8000${user.avatar}` : null);
    setAvatarFile(null);
    setIsEditing(false);
  };


   const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setMyPosts(prev => prev.filter(post => post._id !== postId));
      console.log("✅ Post deleted successfully");
    } catch (err) {
      console.error("❌ Delete failed", err);
    }
  };

  const handleCancel = () => navigate("/");
const fetchFollowList = async (type) => {
  try {
    if (!user?._id) return; // Ensure user is loaded

    const token = localStorage.getItem("token");
    const url =
      type === "followers"
        ? `/follow/followers/${user._id}`
        : `/follow/following/${user._id}`;

    const res = await api.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const users = res.data.filter((profile) => {
      const isOwner = profile._id === user._id;

      const followers = Array.isArray(profile.followers) ? profile.followers : [];
      const following = Array.isArray(profile.following) ? profile.following : [];

      const isMutual = followers.includes(user._id) && following.includes(user._id);
      const isPublic = !profile.isPrivate;

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




 return (
 <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-8 md:px-10">
  <h1 className="text-3xl font-bold mb-8 text-gray-800 w-full text-left">My Profile</h1>

  <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-6 md:p-10 flex flex-col gap-6">
    {/* Profile Header */}
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
      {/* Avatar */}
      <div className="relative w-32 h-32">
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="rounded-full object-cover w-full h-full border-4 border-gray-200"
          />
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-semibold"
            style={{ backgroundColor: getAvatarColor(form.name) }}
          >
            {getInitials(form.name)}
          </div>
        )}
        {isEditing && (
          <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer">
            <input type="file" hidden onChange={handleAvatarChange} />
            📷
          </label>
        )}
      </div>

      {/* Name, Bio, Privacy */}
      <div className="flex-1 w-full">
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            disabled={!isEditing}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring ${
              isEditing ? "bg-white border-gray-300" : "bg-gray-100 border-gray-200"
            }`}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Bio</label>
          <textarea
            value={form.bio}
            disabled={!isEditing}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring ${
              isEditing ? "bg-white border-gray-300" : "bg-gray-100 border-gray-200"
            }`}
          ></textarea>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 text-gray-600 font-medium">
            <input
              type="checkbox"
              disabled={!isEditing}
              checked={form.isPrivate}
              onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
            />
            Private Profile
          </label>
          <p className="text-sm text-gray-500 ml-1 mt-1">
            {form.isPrivate
              ? "Your profile is hidden from others."
              : "Your profile is visible to everyone."}
          </p>
        </div>

        <div className="flex gap-6 mt-3 text-sm text-gray-700">
          <span><strong>{myPosts.length}</strong> Posts</span>
          <span className="cursor-pointer hover:underline" onClick={() => fetchFollowList("followers")}>{followersCount} Followers</span>
          <span className="cursor-pointer hover:underline" onClick={() => fetchFollowList("following")}>{followingCount} Following</span>
        </div>
      </div>
    </div>

    {/* Following List */}
    {showFollowing && (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Following</h3>
        {followingList.map(user => (
          <div key={user._id} className="cursor-pointer flex items-center gap-4 p-3 bg-gray-100 rounded hover:bg-gray-200" onClick={() => navigate(`/user/${user._id}`)}>
            {user.avatar ? (
              <img src={`http://localhost:8000${user.avatar}`} className="w-10 h-10 rounded-full object-cover" alt={user.name} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: getAvatarColor(user.name) }}>
                {getInitials(user.name)}
              </div>
            )}
            <p className="font-medium">{user.name}</p>
          </div>
        ))}
        <button onClick={() => setShowFollowing(false)} className="mt-4 text-blue-600 underline">Close</button>
      </div>
    )}

    {/* Followers List */}
    {showFollowers && (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Followers</h3>
        {followerList.map(user => (
          <div key={user._id} className="cursor-pointer flex items-center gap-4 p-3 bg-gray-100 rounded hover:bg-gray-200" onClick={() => navigate(`/user/${user._id}`)}>
            {user.avatar ? (
              <img src={`http://localhost:8000${user.avatar}`} className="w-10 h-10 rounded-full object-cover" alt={user.name} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: getAvatarColor(user.name) }}>
                {getInitials(user.name)}
              </div>
            )}
            <p className="font-medium">{user.name}</p>
          </div>
        ))}
        <button onClick={() => setShowFollowers(false)} className="mt-4 text-blue-600 underline">Close</button>
      </div>
    )}

    {/* Action Buttons */}
    <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
      <div ref={successRef} className="text-green-600 text-sm hidden">
        ✅ Profile updated successfully
      </div>
      <div className="flex gap-3 ml-auto">
        {isEditing ? (
          <>
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              disabled={isLoading}
            >
              {isLoading ? <span className="saving-text">Saving...</span> : "Save"}
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
          >
            Edit Profile
          </button>
        )}
        <button
          onClick={handleCancel}
          className="text-sm text-red-500 hover:underline ml-2"
        >
          ← Back
        </button>
      </div>
    </div>

    {/* Filter Tabs */}
    <div className="mt-8 w-full">
      <div className="flex justify-center gap-8 mb-4">
        <button
          onClick={() => setMediaFilter("image")}
          className={`py-2 px-4 rounded ${
            mediaFilter === "image" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          🖼️ Image Posts
        </button>
        <button
          onClick={() => setMediaFilter("video")}
          className={`py-2 px-4 rounded ${
            mediaFilter === "video" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          🎥 Video Posts
        </button>
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {myPosts
          .filter(post => mediaFilter === "all" || post.mediaType === mediaFilter)
          .map(post => (
            <div key={post._id} className="w-full aspect-[4/5] relative group bg-white rounded-xl shadow">
              {post.mediaType === "video" ? (
                <video
                  src={post.mediaUrl}
                  className="w-full h-full object-cover rounded-xl"
                  controls
                  muted
                />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt="post"
                  className="w-full h-full object-cover rounded-xl"
                />
              )}

              {/* Delete Button */}
              <button
                onClick={() => handleDeletePost(post._id)}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                title="Delete Post"
              >
                🗑️
              </button>

              {/* Time */}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {formatTimeAgo(post.createdAt)}
              </div>

              {/* Likes and Comments Count */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                ❤️ {post.likes?.length || 0} 💬 {post.comments?.length || 0}
              </div>

              {/* Comments */}
              {/* {post.comments?.length > 0 && (
                <div className="mt-2 bg-gray-100 text-sm max-h-32 overflow-y-auto p-2 rounded-b-xl">
                  <p className="font-semibold text-gray-800 mb-1">Comments:</p>
                  {post.comments.map((comment, index) => (
                    <div key={index} className="mb-1 text-gray-700">
                      <span className="font-medium">{comment.user?.name || "User"}:</span> {comment.text}
                    </div>
                  ))}
                </div>
              )} */}
            </div>
          ))}
      </div>
    </div>
  </div>
</div>

);

}


export default Profile;
