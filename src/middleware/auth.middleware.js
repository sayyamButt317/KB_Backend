import { verifyAccessToken } from "../Utils/jwt.js";

export default function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const token = header.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const payload = verifyAccessToken(token);
    if (!payload?.sub || !payload?.companyId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = {
      id: String(payload.sub),
      companyId: String(payload.companyId),
      role: payload.role || "user",
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized", error: error.message });
  }
}
