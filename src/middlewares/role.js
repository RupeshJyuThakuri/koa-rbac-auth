export const requireRole = (roleName) => {
  return async (ctx, next) => {
    const user = ctx.state.user;

    if (!user) {
      ctx.status = 401;
      ctx.body = { error: "Unauthorized" };
      return;
    }

    if (user.role !== roleName) {
      ctx.status = 403;
      ctx.body = { error: "Forbidden: insufficient role" };
      return;
    }

    await next();
  };
};
