// src/utils/timeAgo.js
export function formatTimeAgo(dateString) {
  const now = new Date();
  const postDate = new Date(dateString);
  const diff = Math.floor((now - postDate) / 1000); // in seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day(s) ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} week(s) ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} month(s) ago`;

  return postDate.toLocaleDateString();
}
