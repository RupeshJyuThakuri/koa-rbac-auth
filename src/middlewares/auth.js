import jwt from "jsonwebtoken";

export const authMiddleware = async (ctx, next) => {
  try {
    const authHeader = ctx.headers["authorization"];
    if (!authHeader) {
      ctx.status = 401;
      ctx.body = { error: "Authorization header missing" };
      return;
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      ctx.status = 401;
      ctx.body = { error: "Token missing" };
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to ctx.state
    ctx.state.user = decoded;

    // Go to next middleware/route
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: "Invalid or expired token" };
  }
};
