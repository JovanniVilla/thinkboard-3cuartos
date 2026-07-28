import express from "express";
import { register, login, logout, getMe, updateProfile, changePassword } from "../controllers/authController.js";
import { protectRoute } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);
router.put("/profile", protectRoute, updateProfile);
router.put("/change-password", protectRoute, changePassword);

export default router;
