// src/routes/auth/forgotReset.js
import Router from "@koa/router";
import { AppDataSource } from "../../config/data-source.js";
import { Otp } from "../../entities/Otp.js";
import { User } from "../../entities/User.js";
import * as yup from "yup";
import { sendEmail } from "../../utils/email.js";
import bcrypt from "bcrypt";

const router = new Router({ prefix: "/api/auth" });

// Generate 6-digit OTP
function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Yup schemas
const forgotSchema = yup.object({
  email: yup.string().email().required(),
});

const resetSchema = yup.object({
  email: yup.string().email().required(),
  code: yup.string().length(6).required(),
  newPassword: yup.string().min(8).max(128).required(),
});

// Forgot password route
router.post("/forgot", async (ctx) => {
  try {
    const value = await forgotSchema.validate(ctx.request.body, {
      abortEarly: false,
    });
    const email = value.email.toLowerCase();

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email } });

    if (!user) {
      ctx.body = { ok: true };
      return;
    }

    const otpRepo = AppDataSource.getRepository(Otp);
    const code = genOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpRecord = otpRepo.create({ email, code, expiresAt, used: false });
    await otpRepo.save(otpRecord);

    // Send email
    try {
      await sendEmail({
        to: email,
        subject: "Your OTP for password reset",
        text: `Your OTP code is: ${code}. It expires in 10 minutes.`,
      });
    } catch (err) {
      console.error("Email send error:", err);
    }

    ctx.body = { ok: true,code };
  } catch (err) {
    ctx.status = 400;
    ctx.body = { error: err.errors ? err.errors[0] : err.message };
  }
});

// Reset password route
router.post("/reset", async (ctx) => {
  try {
    const value = await resetSchema.validate(ctx.request.body, {
      abortEarly: false,
    });
    const { email, code, newPassword } = value;

    const otpRepo = AppDataSource.getRepository(Otp);
    const record = await otpRepo.findOne({
      where: { email, code, used: false },
    });

    if (!record || new Date(record.expiresAt) < new Date()) {
      ctx.status = 400;
      ctx.body = { error: "Invalid or expired OTP" };
      return;
    }

    // Mark OTP as used
    record.used = true;
    await otpRepo.save(record);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email } });

    if (!user) {
      ctx.status = 400;
      ctx.body = { error: "User not found" };
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await userRepo.save(user);

    ctx.body = { ok: true, message: "Password reset successful" };
  } catch (err) {
    ctx.status = 400;
    ctx.body = { error: err.errors ? err.errors[0] : err.message };
  }
});

export default router;
