const router = require("express").Router();
const User = require("../models/User");
const TestAttempt = require("../models/TestAttempt");
const JobPosting = require("../models/JobPosting");
const StudentProfile = require("../models/StudentProfile");
const { protect, allow } = require("../middleware/auth");
router.use(protect, allow("admin"));
router.get("/overview", async (req,res) => {
  const [students,recruiters,tests,attempts,jobs] = await Promise.all([
    User.countDocuments({role:"student"}), User.countDocuments({role:"recruiter"}),
    require("../models/Assessment").countDocuments(), TestAttempt.countDocuments(), JobPosting.countDocuments({active:true})
  ]);
  res.json({students,recruiters,tests,attempts,jobs});
});
router.get("/students", async (req,res) => {
  const users = await User.find({role:"student"}).select("name email photo active createdAt").sort({createdAt:-1}).lean();
  const profiles = await StudentProfile.find({ user: { $in: users.map(u => u._id) } }).select("user college degree cgpa skills resume").lean();
  const byUser = new Map(profiles.map(p => [String(p.user), p]));
  res.json(users.map(u => { const profile = byUser.get(String(u._id)) || null; return { ...u, profile: profile ? { ...profile, resume: !!profile.resume } : null }; }));
});
router.patch("/users/:id", async (req,res) => res.json(await User.findByIdAndUpdate(req.params.id,{active:!!req.body.active},{new:true}).select("name email role active")));
router.get("/reports", async (req,res) => res.json(await TestAttempt.find().populate("student","name email").populate("assessment","title category").sort({createdAt:-1}).limit(200)));
module.exports = router;
