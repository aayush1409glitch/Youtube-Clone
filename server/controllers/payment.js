import Razorpay from "razorpay";
import crypto from "crypto";
import users from "../Modals/Auth.js";
import nodemailer from "nodemailer";
import Channel from "../Modals/channel.js";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_key_secret",
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const createOrder = async (req, res) => {
  try {
    const { amount, plan } = req.body;
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      channelId,
      plan,
      amount,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_key_secret")
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const planExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Days Expiry

    let updatedChannel = null;
    if (channelId) {
      const channel = await Channel.findById(channelId);
      if (channel) {
        channel.plan = plan;
        channel.planExpiry = planExpiry;
        updatedChannel = await channel.save();
      }
    }

    const user = await users.findById(userId);
    if (user) {
      user.plan = plan;
      user.planExpiry = planExpiry;
      await user.save();
    }

    if (user && user.email) {
      if (process.env.BREVO_API_KEY) {
        fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'YourTube Premium', email: process.env.EMAIL_USER || 'majorghost111@gmail.com' },
            to: [{ email: user.email }],
            subject: "YourTube Subscription Invoice",
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #eab308; text-align: center;">Welcome to YourTube ${plan.charAt(0).toUpperCase() + plan.slice(1)}!</h2>
                <p>Hi ${user.name || "User"},</p>
                <p>Thank you for upgrading your subscription! Your payment was successful.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Invoice Details</h3>
                  <p><strong>Plan:</strong> ${plan.toUpperCase()}</p>
                  <p><strong>Amount Paid:</strong> ₹${amount}</p>
                  <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>You can now enjoy your premium perks immediately.</p>
                <p>Best Regards,<br>The YourTube Team</p>
              </div>
            `
          })
        }).catch(console.error);
      } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
          from: `"YourTube Premium" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "YourTube Subscription Invoice",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #eab308; text-align: center;">Welcome to YourTube ${plan.charAt(0).toUpperCase() + plan.slice(1)}!</h2>
              <p>Hi ${user.name || "User"},</p>
              <p>Thank you for upgrading your subscription! Your payment was successful.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Details</h3>
                <p><strong>Plan:</strong> ${plan.toUpperCase()}</p>
                <p><strong>Amount Paid:</strong> ₹${amount}</p>
                <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>You can now enjoy your premium perks immediately.</p>
              <p>Best Regards,<br>The YourTube Team</p>
            </div>
          `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.error("Email error:", error);
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      channel: updatedChannel,
      user,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};
