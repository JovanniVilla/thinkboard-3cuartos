import express from "express";
import { register, login, logout, getMe, claimAdmin } from "../controllers/authController.js";
import { protectRoute } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);
router.post("/claim-admin", claimAdmin);

export default router;
