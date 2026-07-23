import express from "express";
import {
  getAllAccounts,
  approveAccount,
  rejectAccount,
  changeRole,
  deleteAccount,
} from "../controllers/accountController.js";
import { protectRoute, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// All account management routes require admin
router.use(protectRoute, requireAdmin);

router.get("/", getAllAccounts);
router.put("/:id/approve", approveAccount);
router.put("/:id/reject", rejectAccount);
router.put("/:id/role", changeRole);
router.delete("/:id", deleteAccount);

export default router;
