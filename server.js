import express from "express";
import dotenv from "dotenv";
import connectToDatabase from "./db.js";
import bcrypt from "bcrypt";
import User from "./schema.js";
import jsonwebtoken from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();
const app = express();
const PORT = process.env.PORT;
connectToDatabase();
const saltRounds = 10;
app.use(express.json());

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      let message = "Username or email already in use";
      if (existingUser.username === username) {
        message = "Username already exists";
      } else if (existingUser.email === email) {
        message = "Email address already exists";
      }
      return res.status(409).json({ message });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const payload = { userId: user._id };
    const secret = process.env.JWT_SECRET;
    const token = jsonwebtoken.sign(payload, secret, { expiresIn: "1h" }); // Set an appropriate expiration time

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Missing required field: email" });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "Email address not found" });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour expiration

    await user.save();
    const resetUrl = `http://localhost:5000/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL, 
        pass: process.env.PASSWORD,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
    const emailOptions = {
      from: '"Node banao" padmalochanmaiti58@gmail.com',
      to: email,
      subject: "Password Reset Request",
      text: `You have requested a password reset for your account.\n\nClick on the following link to reset your password:\n ${resetUrl}\n\nIf you did not request a password reset, please ignore this email.\n`,
    };

    const info = await transporter.sendMail(emailOptions);

    console.log("Email sent: %s", info.response);
    res
      .status(200)
      .json({ message: "Password reset instructions sent to your email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/reset-password/:resetToken", async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({ passwordResetToken: resetToken });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid or expired reset token" });
    }

    if (user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log("Server started!!");
});
