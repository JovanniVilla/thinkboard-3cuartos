import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Generates a JWT and sets it as an httpOnly cookie on the response.
 */
function generateTokenAndSetCookie(userId, role, res) {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
}

/**
 * POST /api/auth/register
 * Register a new user. The first user ever registered becomes admin (auto-approved).
 * Subsequent users are created as pending (isApproved: false).
 */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Ya existe una cuenta con ese email" });
    }

    // First user becomes admin and is auto-approved
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    const role = isFirstUser ? "admin" : "user";
    const isApproved = isFirstUser; // only first user is auto-approved

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      isApproved,
    });

    await user.save();

    // For first user (admin): log them in immediately
    // For others: return success but don't issue a token (they need approval)
    if (isApproved) {
      generateTokenAndSetCookie(user._id, user.role, res);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    });
  } catch (error) {
    console.error("Error in register controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/auth/login
 * Authenticate user with email and password.
 * Blocks login if user is not yet approved by admin.
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Check if user is approved
    if (!user.isApproved) {
      return res.status(403).json({
        message: "Tu cuenta está pendiente de aprobación por un administrador",
        pendingApproval: true,
      });
    }

    generateTokenAndSetCookie(user._id, user.role, res);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    });
  } catch (error) {
    console.error("Error in login controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/auth/logout
 * Clear the auth cookie.
 */
export async function logout(_, res) {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });
    res.status(200).json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("Error in logout controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/auth/me
 * Return the currently authenticated user.
 */
export async function getMe(req, res) {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in getMe controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
