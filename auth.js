const jwt = require("jsonwebtoken");
const User = require("../models/User");
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development_secret_change_me");
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user || !req.user.active) return res.status(401).json({ message: "Account unavailable" });
    next();
  } catch { res.status(401).json({ message: "Invalid or expired token" }); }
};
exports.allow = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission" });
  next();
};
