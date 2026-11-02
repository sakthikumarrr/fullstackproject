const mongoose = require("mongoose");
module.exports = mongoose.model("Company", new mongoose.Schema({
  name: { type: String, required: true }, website: String, industry: String,
  description: String, logo: String, location: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true }));
