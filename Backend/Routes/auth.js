const express = require("express")
const User = require("../Models/User")
const authMiddleware = require("../Middleware/authMiddleware")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const { name, role, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "User already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, role, password: hashedPassword });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(201).json({ token })

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
})

router.post("/login", async (req,res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(404).json({message: "User does not exist"});
        }

        const isValid = await bcrypt.compare(password, user.password);
        if(!isValid) {
            return res.status(401).json({message: "Unauthorized access"});
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.status(201).json({ message: "Login Successful", token: token, role: user.role })

    } catch(err) {
        res.status(500).json({message: "Server Error"});
    }
})

router.get("/me", authMiddleware, async (req,res) => {
    const user = await User.findOne({ _id: req.user });
    res.json(user);
})


module.exports = router