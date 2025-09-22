import Router from "@koa/router";
import { AppDataSource } from "../config/data-source.js";
import { Profile } from "../entities/Profile.js";
import { User } from "../entities/User.js";
import { authMiddleware } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";
import * as yup from "yup";
import fs from "fs";
import path from "path";

const router = new Router({ prefix: "/api/profile" });

// Yup validation schema
const profileSchema = yup.object({
  bio: yup.string().max(1000).nullable(),
  phoneNumber: yup
    .string()
    .matches(/^[0-9+\-() ]{6,20}$/)
    .nullable(),
  address: yup.string().max(1000).nullable(),
  dateOfBirth: yup.date().nullable(),
});

// ---------------------
// PUT /api/profile/update
// ---------------------
router.put(
  "/update",
  authMiddleware,
  upload.single("profilePicture"),
  async (ctx) => {
    const userId = ctx.state.user.id;
    const profileRepo = AppDataSource.getRepository(Profile);
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["profile"],
    });

    if (!user) {
      if (ctx.file) fs.unlinkSync(ctx.file.path);
      ctx.status = 404;
      ctx.body = { error: "User not found" };
      return;
    }

    const body = ctx.request.body || {};

    try {
      const value = await profileSchema.validate(body, { abortEarly: false });

      let profile = user.profile;
      if (!profile) profile = profileRepo.create({ user });

      // Update fields
      profile.bio = value.bio ?? profile.bio;
      profile.phoneNumber = value.phoneNumber ?? profile.phoneNumber;
      profile.address = value.address ?? profile.address;
      profile.dateOfBirth = value.dateOfBirth
        ? new Date(value.dateOfBirth)
        : profile.dateOfBirth;

      if (ctx.file) {
        // Delete old picture
        if (profile.profilePicture) {
          try {
            const oldRelative = profile.profilePicture.replace(
              `${ctx.protocol}://${ctx.host}/`,
              ""
            );
            const oldPath = path.join(process.cwd(), oldRelative);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          } catch (e) {
            console.error("Old file delete error:", e);
          }
        }

        // Save new picture URL
        const relativePath = path
          .relative(path.join(process.cwd(), "uploads"), ctx.file.path)
          .replace(/\\/g, "/");

        profile.profilePicture = `${ctx.protocol}://${ctx.host}/${relativePath}`;
      }

      const saved = await profileRepo.save(profile);

      ctx.body = {
        message: "Profile updated",
        profile: {
          id: saved.id,
          profilePicture: saved.profilePicture,
          bio: saved.bio,
          phoneNumber: saved.phoneNumber,
          address: saved.address,
          dateOfBirth: saved.dateOfBirth,
        },
      };
    } catch (err) {
      if (ctx.file) fs.unlinkSync(ctx.file.path);
      ctx.status = 400;
      ctx.body = { error: err.errors ? err.errors.join(", ") : err.message };
    }
  }
);

// ---------------------
// GET /api/profile
// ---------------------
router.get("/", authMiddleware, async (ctx) => {
  const userRepo = AppDataSource.getRepository(User);
  const profileRepo = AppDataSource.getRepository(Profile);

  const user = await userRepo.findOne({
    where: { id: ctx.state.user.id },
    relations: ["role", "profile"],
  });

  if (!user) {
    ctx.status = 404;
    ctx.body = { error: "User not found" };
    return;
  }

  ctx.body = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    profile: user.profile
      ? {
          id: user.profile.id,
          profilePicture: user.profile.profilePicture,
          bio: user.profile.bio,
          phoneNumber: user.profile.phoneNumber,
          address: user.profile.address,
          dateOfBirth: user.profile.dateOfBirth,
        }
      : null,
  };
});

export default router;
