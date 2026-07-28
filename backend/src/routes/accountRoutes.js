import express from "express";
import {
  getAllAccounts,
  approveAccount,
  rejectAccount,
  changeRole,
  deleteAccount,
  resetUserPassword,
} from "../controllers/accountController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// All account routes require authentication
router.use(protectRoute);

// Any authenticated user can get the list of accounts
router.get("/", getAllAccounts);

// The following account management routes require admin
router.use(requireAdmin);
router.put("/:id/approve", approveAccount);
router.put("/:id/reject", rejectAccount);
router.put("/:id/role", changeRole);
router.put("/:id/reset-password", resetUserPassword);
router.delete("/:id", deleteAccount);

export default router;
