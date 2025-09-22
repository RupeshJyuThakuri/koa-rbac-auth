import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import serve from "koa-static";
import path from "path";

import authRouter from "./src/routes/auth.js";
import forgotResetRouter from "./src/routes/auth/forgotReset.js";
import profileRouter from "./src/routes/profile.js";
import userRoutes from "./src/routes/userRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";

import { AppDataSource } from "./src/config/data-source.js";
import { Role } from "./src/entities/Role.js";

const app = new Koa();
app.use(cors());

// Serve uploads folder at /uploads
app.use(serve(path.join(process.cwd(), "uploads")));

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message || "Internal Server Error" };
    console.error("Error:", err);
  }
});

app.use(bodyParser());

// Routes
app.use(authRouter.routes()).use(authRouter.allowedMethods());
app.use(forgotResetRouter.routes()).use(forgotResetRouter.allowedMethods());
app.use(profileRouter.routes()).use(profileRouter.allowedMethods());
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());
app.use(dashboardRoutes.routes()).use(dashboardRoutes.allowedMethods());

// Seed roles
async function seedRoles() {
  const roleRepo = AppDataSource.getRepository(Role);
  const roles = ["Admin", "User"];

  for (const r of roles) {
    const existing = await roleRepo.findOne({ where: { name: r } });
    if (!existing) {
      await roleRepo.save({ name: r });
    }
  }
}

// Initialize DB and start server
AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected ✅");

    await seedRoles();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("DB init error:", err));
