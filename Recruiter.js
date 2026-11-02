const mongoose = require("mongoose");
module.exports = mongoose.model("Recruiter", new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  designation: String, phone: String
}, { timestamps: true }));
