const express = require("express");
const jwt = require("jsonwebtoken");

const authMiddleware = (req,res,next) => {
    try {
        const token = req.headers.authorization;
        if(!token) {
            res.status(401).json({message : "token not found"});
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

module.exports = authMiddleware