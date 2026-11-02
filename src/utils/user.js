export const getStoredUser = () => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

export const isEmailVerified = (user) => {
  if (!user) return false;
  const value = user.email_verified;
  return value === true || value === 1 || value === "1" || value === "true";
};
