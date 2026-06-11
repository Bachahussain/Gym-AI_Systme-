// logout.js (controller)
const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
  return res.json({ success: true, message: "Logged out successfully" });
};

export default logout;