import Router from "@koa/router";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as yup from "yup";
import { AppDataSource } from "../config/data-source.js";
import { User } from "../entities/User.js";
import { Role } from "../entities/Role.js";

const router = new Router({ prefix: "/auth" });

// Validation schema with Yup
const registerSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .matches(/[0-9]/, "Password must contain a number")
    .matches(/[!@#$%^&*]/, "Password must contain a symbol")
    .required("Password is required"),
  role: yup.string().oneOf(["Admin", "User"]).default("User"),
});

// REGISTER
router.post("/register", async (ctx) => {
  try {
    const body = ctx.request.body;
    const { name, email, password, role } = await registerSchema.validate(
      body,
      { abortEarly: false }
    );

    // Check if user already exists
    const userRepo = AppDataSource.getRepository(User);
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
      ctx.status = 400;
      ctx.body = { error: "Email already registered" };
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get role
    const roleRepo = AppDataSource.getRepository(Role);
    const userRole = await roleRepo.findOne({
      where: { name: role || "User" },
    });

    // Create user
    const newUser = userRepo.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
    });

    await userRepo.save(newUser);

    ctx.status = 201;
    ctx.body = { message: "User registered successfully" };
  } catch (err) {
    ctx.status = 400;
    ctx.body = { error: err.errors || err.message };
  }
});

// LOGIN
router.post("/login", async (ctx) => {
  try {
    const { email, password } = ctx.request.body;

    if (!email || !password) {
      ctx.status = 400;
      ctx.body = { error: "Email and password are required" };
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { email },
      relations: ["role"] // fetch role too
    });

    if (!user) {
      ctx.status = 400;
      ctx.body = { error: "Invalid credentials" };
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      ctx.status = 400;
      ctx.body = { error: "Invalid credentials" };
      return;
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    ctx.body = {
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name
      }
    };

  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: "Something went wrong" };
  }
});


export default router;
