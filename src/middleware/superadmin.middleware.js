export default function superadminMiddleware(req, res, next) {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Superadmin access required",
    });
  }
  return next();
}
