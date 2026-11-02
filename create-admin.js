require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pathway_placement";
  await mongoose.connect(uri);
  const email = "admin@launchly.dev";
  const password = "Pathway@123";
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name: "Launchly Admin",
        email,
        password: hashedPassword,
        role: "admin",
        active: true
      }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  console.log("Admin account is ready.");
  console.log("Email: admin@launchly.dev");
  console.log("Password: Pathway@123");
  console.log("Role: admin");
  await mongoose.disconnect();
})().catch(async error => {
  console.error("Could not create admin:", error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
