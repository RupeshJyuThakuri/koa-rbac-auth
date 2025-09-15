import Router from "@koa/router";
import { AppDataSource } from "../config/data-source.js";
import { User } from "../entities/User.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";


const router = new Router({ prefix: "/users" });


router.get("/", authMiddleware, requireRole("Admin"), async (ctx) => {
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ relations: ["role"] }); // include role info

  // Remove passwords before sending
  const safeUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.name,
  }));

  ctx.body = safeUsers;
});



router.get("/profile", authMiddleware, async (ctx) => {
  const userRepo = AppDataSource.getRepository(User);

  // ctx.state.user was set in authMiddleware after verifying JWT
  const user = await userRepo.findOne({
    where: { id: ctx.state.user.id },
    relations: ["role"],
  });

  if (!user) {
    ctx.status = 404;
    ctx.body = { error: "User not found" };
    return;
  }

  // Never return the password
  ctx.body = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
  };
});

export default router;
