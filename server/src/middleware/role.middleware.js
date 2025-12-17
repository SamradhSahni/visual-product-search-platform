// server/src/middleware/role.middleware.js

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Role '${req.user.role}' not authorized` });
    }
    next();
  };
};
