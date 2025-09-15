// src/app.js
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import userRoutes from "./routes/userRoutes.js";
import authRouter from "./routes/auth.js";
import { AppDataSource } from "./config/data-source.js";
import { Role } from "./entities/Role.js";

const app = new Koa();

// ✅ Global error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message || "Internal Server Error" };
    console.error("Error:", err);
  }
});

// ✅ Middlewares
app.use(bodyParser());

// ✅ Routes
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());
app.use(authRouter.routes()).use(authRouter.allowedMethods());

// ✅ Role seeding
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

// ✅ Initialize DB & start server
AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected ✅");

    // Seed default roles
    await seedRoles();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("DB init error:", err));
