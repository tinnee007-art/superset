// ✅ Generate UUID
export const generateRequestId = () => {
  return crypto.randomUUID();
};

// ✅ Get user from Superset bootstrap
export const getCurrentUser = () => {
  const user = window?.bootstrapData?.common?.user;

  return {
    username: user?.username || '',
    email: user?.email || '',
  };
};