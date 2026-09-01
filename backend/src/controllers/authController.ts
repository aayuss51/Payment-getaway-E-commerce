import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as otpService from '../services/otpService';
import { sendEmail } from '../services/emailService';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' });
};

export const sendOtp = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = otpService.generateOtp(email);
  let subject = "Your Verification Code - BazaarNepal";
  let html = "";

  const baseStyles = "font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;";
  const otpBoxStyles = "background: #fff7ed; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;";
  const otpStyles = "font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #92400e;";
  const footerStyles = "font-size: 12px; color: #999; text-align: center;";

  if (purpose && purpose.includes("reset")) {
    subject = "Password Reset Request - BazaarNepal";
    html = `
      <div style="${baseStyles}">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #1a1a1a; font-family: serif; font-style: italic; margin: 0;">BazaarNepal</h1>
          <div style="height: 2px; width: 50px; background: #d97706; margin: 10px auto;"></div>
        </div>
        <h2 style="color: #d97706; margin-bottom: 20px; font-size: 20px; text-align: center;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your BazaarNepal account. Please use the verification code below to proceed with your password reset:</p>
        <div style="${otpBoxStyles}">
          <span style="${otpStyles}">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">This code is valid for <strong>10 minutes</strong>. For security reasons, do not share this code with anyone.</p>
        <p style="color: #666; font-size: 14px;">If you did not request this reset, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <div style="text-align: center;">
          <p style="margin: 0; color: #1a1a1a; font-weight: bold; font-size: 13px;">Artisanal Excellence</p>
          <p style="${footerStyles}">&copy; 2026 BazaarNepal. All rights reserved.</p>
        </div>
      </div>
    `;
  } else if (purpose && purpose.includes("register")) {
    subject = "Welcome! Verify Your Account - BazaarNepal";
    html = `
      <div style="${baseStyles}">
        <h2 style="color: #d97706; margin-bottom: 20px;">Account Verification</h2>
        <p>Welcome to BazaarNepal!</p>
        <p>Thank you for registering. Please use the following code to verify your email address and activate your account:</p>
        <div style="${otpBoxStyles}">
          <span style="${otpStyles}">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="${footerStyles}">&copy; 2026 BazaarNepal. All rights reserved.</p>
      </div>
    `;
  } else {
    // Default (Login / general)
    const displayAction = purpose ? purpose : "log in to your account";
    subject = "Your Login OTP - BazaarNepal";
    html = `
      <div style="${baseStyles}">
        <h2 style="color: #d97706; margin-bottom: 20px;">Secure Login</h2>
        <p>Welcome back to BazaarNepal!</p>
        <p>You requested an OTP to ${displayAction}. Use the following code to securely proceed:</p>
        <div style="${otpBoxStyles}">
          <span style="${otpStyles}">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't attempt to log in, please secure your account.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="${footerStyles}">&copy; 2026 BazaarNepal. All rights reserved.</p>
      </div>
    `;
  }

  const emailResult = await sendEmail({
    to: email,
    subject: subject,
    html: html,
  });

  if (emailResult.success) {
    return res.json({ success: true, message: "OTP sent successfully" });
  } else {
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const result = otpService.verifyOtp(email, otp);

  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  // Find or create user
  try {
    let user = await User.findOne({ email });
    
    if (!user) {
      // If user doesn't exist, we'll return a special flag so frontend can redirect to registration
      // Or just create a basic one if we have minimal info
      return res.json({ 
        success: true, 
        message: "OTP verified, user needs to complete registration",
        needsRegistration: true,
        email 
      });
    }

    const token = generateToken(user._id as string, user.role);
    res.json({ 
      success: true, 
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        displayName: user.displayName
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, displayName, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    user = await User.create({
      uid: Math.random().toString(36).substring(7), // In a real app, this might come from Firebase or be the MongoDB _id
      email,
      displayName,
      role: role || 'buyer'
    });

    const token = generateToken(user._id as string, user.role);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        displayName: user.displayName
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
