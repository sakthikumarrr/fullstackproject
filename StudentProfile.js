const mongoose = require("mongoose");
module.exports = mongoose.model("StudentProfile", new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  phone: String, college: String, degree: String, branch: String, graduationYear: Number,
  cgpa: { type: Number, min: 0, max: 10 }, skills: [String], resume: String, bio: String
}, { timestamps: true }));
