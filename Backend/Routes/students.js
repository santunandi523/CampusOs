const express = require("express");
const User = require("../Models/User.js");
const authMiddleware = require("../Middleware/authMiddleware.js");
const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user);
  if(!user) return res.status(404).json({message: "User not found"});
  res.status(200).json(user.students);
});

module.exports = router;