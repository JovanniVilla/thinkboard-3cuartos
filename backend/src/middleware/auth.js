import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware that protects routes by verifying JWT token from cookies.
 * Attaches the authenticated user document to req.user (without password).
 */
export async function protectRoute(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "No autorizado — no se proporcionó token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "No autorizado — usuario no encontrado" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "No autorizado — token inválido o expirado" });
    }
    console.error("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Middleware that restricts access to admin users only.
 * Must be used AFTER protectRoute.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Acceso denegado — se requiere rol de administrador" });
  }
  next();
}

/**
 * Middleware that restricts access to admin or team users only.
 */
export function requireAdminOrTeam(req, res, next) {
  if (req.user?.role !== "admin" && req.user?.role !== "team") {
    return res.status(403).json({ message: "Acceso denegado — se requiere rol de equipo o administrador" });
  }
  next();
}
