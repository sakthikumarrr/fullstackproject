const router = require("express").Router();
const MockInterview = require("../models/MockInterview");
const InterviewFeedback = require("../models/InterviewFeedback");
const { protect, allow } = require("../middleware/auth");
router.get("/", protect, async (req,res) => {
  const filter = req.user.role === "student" ? { $or:[{student:req.user._id},{student:null}] } : {};
  res.json(await MockInterview.find(filter).sort({scheduledAt:1}));
});
router.post("/", protect, allow("admin","recruiter"), async (req,res) => res.status(201).json(await MockInterview.create({...req.body,createdBy:req.user._id})));
router.post("/:id/feedback", protect, async (req,res) => res.status(201).json(await InterviewFeedback.create({interview:req.params.id,student:req.user._id,reviewer:req.user._id,...req.body})));
router.get("/feedback/mine", protect, allow("student"), async (req,res) => res.json(await InterviewFeedback.find({student:req.user._id}).populate("interview","title type scheduledAt")));
module.exports = router;
