const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["student", "admin", "recruiter"], default: "student" },
  photo: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model("User", schema);
