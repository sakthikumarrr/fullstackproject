const mongoose = require("mongoose");
module.exports = mongoose.model("JobPosting", new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String, description: String, location: String, type: String, minCgpa: Number,
  skills: [String], deadline: Date, active: { type: Boolean, default: true }
}, { timestamps: true }));
