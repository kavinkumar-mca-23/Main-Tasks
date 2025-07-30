import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Messages from "./pages/Messages";
import PostsPage from "./pages/PostsPage";
import CreatePostPage from "./pages/CreatePostPage";
import Explore from "./pages/Explore";
import GroupPage from "./pages/GroupPage";


import SuggestedUsers from "./pages/SuggestedUsers"; // 👈 Suggested users list page
import UserProfile from "./pages/UserProfile";
// import UserProfile from "./pages/UserProfile"; // 👈 Detailed profile page on click
// import Notifications from "./components/posts/Notifications"; // 👈 Notifications page
 import Notifications from "./pages/Notifications";
// import UserCard from "./components/UserCard";
import FollowPage from "./pages/FollowPage";
// Components
import Sidebar from "./components/Sidebar";

// Auth context
import { AuthProvider, useAuth } from "./context/AuthContext";
//notification context
import { NotificationProvider } from "./context/NotificationContext";


// ✅ PrivateRoute wrapper to restrict acceszs if not logged in
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// ✅ AppRoutes handles route config and sidebar visibility
const AppRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Hide sidebar on login/register
  const hideSidebar = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!hideSidebar && user && <Sidebar />}
      <NotificationProvider userId={user ?._id}>

      <Routes>
        {/* ✅ Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ Private Routes - require authentication */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <PrivateRoute>
              <Explore />
            </PrivateRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />
         <Route
          path="/groups"
          element={
            <PrivateRoute>
              <GroupPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/posts"
          element={
            <PrivateRoute>
              <PostsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-post"
          element={
            <PrivateRoute>
              <CreatePostPage />
            </PrivateRoute>
          }
        />

         {/* ✅ Suggested Users List Page */}
          <Route
        path="/suggested"
        element={
          <PrivateRoute>
            <SuggestedUsers />
          </PrivateRoute>
        }
      /> 

       <Route
        path="/user/:id"
        element={
          <PrivateRoute>
            <UserProfile />
          </PrivateRoute>
        }
      />

      

        {/* ✅ Individual User Profile Page */}
        {/* <Route
          path="/user/:id"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        /> */}
          <Route path="/follow" element={
          <PrivateRoute>
            <FollowPage />
          </PrivateRoute>
        } />
        


        {/* Fallback route - redirect based on login state */}
        <Route path="*" element={<Navigate to={user ? "/home" : "/login"} />} />
      </Routes>
      </NotificationProvider>
    </>
  );
};

// ✅ Main App component
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Router>
        <AppRoutes />
        <ToastContainer />
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
