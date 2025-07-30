// utils/avatarUtils.js
export const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.split(" ");
  return parts.map(part => part[0].toUpperCase()).join("").slice(0, 2);
};

export const getAvatarColor = (name) => {
  const colors = ["#FFB6C1", "#B19CD9", "#77DD77", "#FFD700", "#87CEFA"];
  let hash = 0;
  if (!name) name = "User";
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
