import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import superadminMiddleware from "../middleware/superadmin.middleware.js";
import {
  getAllCompanies,
  getCompanyById,
} from "../controllers/superadmin/company/company.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(superadminMiddleware);

// Plural (preferred)
router.get("/companies", getAllCompanies);
router.get("/companies/:id", getCompanyById);

export default router;
