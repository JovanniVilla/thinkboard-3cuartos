import express from "express";
import { register, login, logout, getMe, updateProfile, changePassword, updatePreferences } from "../controllers/authController.js";
import { protectRoute } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);
router.put("/profile", protectRoute, updateProfile);
router.put("/change-password", protectRoute, changePassword);
router.put("/preferences", protectRoute, updatePreferences);

export default router;
