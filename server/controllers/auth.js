import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import Channel from "../Modals/channel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const login = async (req, res) => {
  const { email, name, image, deviceFootprint } = req.body;

  try {
    const existingUser = await users.findOne({ email });

    // Calculate time-based theme for IST (10 AM to 12 PM IST = light, all other times = dark)
    const istHourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false
    }).format(new Date());
    const hours = parseInt(istHourStr, 10);
    const theme = (hours >= 10 && hours < 12) ? "light" : "dark";

    // Get client location
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // Handle localhost IPv6 loopback
    if (clientIp === '::1' || clientIp === '127.0.0.1') {
      clientIp = 'Localhost';
    }
    
    let locationString = "Unknown Location";
    if (clientIp !== 'Localhost') {
      try {
        const response = await fetch(`http://ip-api.com/json/${clientIp}`);
        const geoData = await response.json();
        if (geoData && geoData.status === 'success') {
          locationString = `${geoData.city}, ${geoData.regionName}`;
        }
      } catch (err) {
        console.error("Geo IP error:", err.message);
      }
    } else {
      locationString = "Localhost City, Localhost State";
    }

    if (!existingUser) {
      const newUser = await users.create({ 
        email, 
        name, 
        image, 
        theme,
        trustedDevices: deviceFootprint ? [deviceFootprint] : [],
        trustedLocations: [locationString]
      });
      return res.status(201).json({ result: newUser });
    } else {
      // Auto-expire subscription if 30 days have passed
      if (existingUser.plan !== "free" && existingUser.planExpiry && new Date() > new Date(existingUser.planExpiry)) {
        existingUser.plan = "free";
        existingUser.planExpiry = null;
      }

      // Auto-set theme on login (time-based)
      existingUser.theme = theme;

      const isNewDevice = deviceFootprint && !existingUser.trustedDevices.includes(deviceFootprint);
      const isNewLocation = !existingUser.trustedLocations.includes(locationString);

      // Check if device or location is new
      if (isNewDevice || isNewLocation) {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        existingUser.otp = otp;
        existingUser.otpExpiry = otpExpiry;
        await existingUser.save();

        if (process.env.BREVO_API_KEY) {
          fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': process.env.BREVO_API_KEY,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: { name: 'YourTube Security', email: process.env.EMAIL_USER || 'majorghost111@gmail.com' },
              to: [{ email: email }],
              subject: "YourTube - Login Verification Code",
              htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Login Verification</h2>
                  <p>We detected a login attempt from a new device or location: <b>${locationString}</b>.</p>
                  <p>Your verification code is: <b style="font-size: 24px; color: #dc2626;">${otp}</b></p>
                  <p>This code will expire in 10 minutes.</p>
                </div>
              `
            })
          }).then(res => res.json())
            .then(data => console.log("Brevo API Response:", data))
            .catch(console.error);
        } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          transporter.sendMail({
            from: `"YourTube Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "YourTube - Login Verification Code",
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Login Verification</h2>
                <p>We detected a login attempt from a new device or location: <b>${locationString}</b>.</p>
                <p>Your verification code is: <b style="font-size: 24px; color: #dc2626;">${otp}</b></p>
                <p>This code will expire in 10 minutes.</p>
              </div>
            `
          }).catch(console.error);
        }

        return res.status(202).json({ requiresOTP: true, email, locationString });
      }

      await existingUser.save();
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp, deviceFootprint, locationString } = req.body;
  try {
    const user = await users.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP Valid
    user.otp = null;
    user.otpExpiry = null;
    if (deviceFootprint && !user.trustedDevices.includes(deviceFootprint)) {
      user.trustedDevices.push(deviceFootprint);
    }
    if (locationString && !user.trustedLocations.includes(locationString)) {
      user.trustedLocations.push(locationString);
    }
    await user.save();

    return res.status(200).json({ result: user });
  } catch (error) {
    console.error("OTP Verification error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateTheme = async (req, res) => {
  const { userId, theme } = req.body;
  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.theme = theme;
    await user.save();
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const toggleSubscribe = async (req, res) => {
  const { userId } = req.body;
  const { channelName, uploaderId, avatar } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(500).json({ message: "Invalid User" });
  }

  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if already subscribed using uploaderId or channelName
    const existingSubIndex = user.subscriptions.findIndex(
      (sub) => sub.channelName === channelName || sub.uploaderId === uploaderId
    );

    if (existingSubIndex !== -1) {
      // Unsubscribe
      user.subscriptions.splice(existingSubIndex, 1);
    } else {
      // Subscribe
      user.subscriptions.push({ channelName, uploaderId, avatar });
    }

    const updatedUser = await user.save();
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Subscribe error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const downloadVideo = async (req, res) => {
  const { userId, channelId, videoId, videoTitle, videoUrl } = req.body;
  
  try {
    let targetEntity = null;

    // 1. Try finding User first
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      targetEntity = await users.findById(userId);
    }
    
    // 2. Fallback to Channel if user not passed or not found
    if (!targetEntity && channelId && mongoose.Types.ObjectId.isValid(channelId)) {
      targetEntity = await Channel.findById(channelId);
    }

    if (!targetEntity) {
      return res.status(400).json({ message: "Must be logged in to download videos." });
    }

    // Auto-expire subscription if 30 days have passed
    if (targetEntity.plan !== "free" && targetEntity.planExpiry && new Date() > new Date(targetEntity.planExpiry)) {
      targetEntity.plan = "free";
      targetEntity.planExpiry = null;
      await targetEntity.save();
    }

    // Determine plan
    const userPlan = targetEntity.plan || "free";

    // Enforce limits per 24 hours (rolling 24h window)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const downloads24h = (targetEntity.downloads || []).filter(d => {
      return new Date(d.downloadDate) >= twentyFourHoursAgo;
    });

    let limit = 1; // Default free plan: 1 video per 24h
    if (userPlan === "bronze") limit = 5;
    if (userPlan === "silver") limit = 15;
    
    // If plan is NOT gold, check 24h limit
    if (userPlan !== "gold" && downloads24h.length >= limit) {
      return res.status(403).json({ 
        message: `Download limit reached for ${userPlan.toUpperCase()} plan (${limit} video${limit > 1 ? 's' : ''} per 24 hours). Upgrade your plan for more downloads!` 
      });
    }

    // Record the download
    if (!targetEntity.downloads) targetEntity.downloads = [];
    targetEntity.downloads.unshift({
      videoId,
      videoTitle,
      videoUrl,
      downloadDate: new Date()
    });

    const updatedEntity = await targetEntity.save();
    return res.status(200).json({
      success: true,
      downloads: updatedEntity.downloads,
      entity: updatedEntity
    });
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const upgradePlan = async (req, res) => {
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid User" });
  }

  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.plan = "premium";
    const updatedUser = await user.save();
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Upgrade error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteDownload = async (req, res) => {
  const { channelId: entityId, downloadId } = req.params;

  if (!entityId || !mongoose.Types.ObjectId.isValid(entityId)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    // 1. Try finding User first
    let entity = await users.findById(entityId);
    
    // 2. Fallback to Channel
    if (!entity) {
      entity = await Channel.findById(entityId);
    }

    if (!entity) return res.status(404).json({ message: "User or Channel not found" });

    // Filter out the specific download instance using its _id
    entity.downloads = (entity.downloads || []).filter(d => d._id?.toString() !== downloadId);
    
    const updatedEntity = await entity.save();
    return res.status(200).json(updatedEntity);
  } catch (error) {
    console.error("Delete download error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getOtpForTesting = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await users.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ otp: user.otp });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
