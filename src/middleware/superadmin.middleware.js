import UserModel from "../Model/User.Model.js";

export default async function superadminMiddleware(req, res, next) {
  try {
    // Prefer live DB role so a Mongo update to "superadmin" works after re-login
    // and stale JWTs with role "admin" are rejected correctly.
    const user = await UserModel.findById(req.user.id).select("role");
    const role = user?.role || req.user?.role;

    if (role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin access required",
        role: role || null,
      });
    }

    req.user.role = "superadmin";
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
