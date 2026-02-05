import { Router } from "express";
import {
    createService,
    setAvailability,
    getServices
} from "../controller/serviceController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
const router = Router();
router.get("/", authenticateToken, getServices); 
router.post("/", authenticateToken, requireRole("SERVICE_PROVIDER"), createService);
router.post("/:serviceId/availability", authenticateToken, requireRole("SERVICE_PROVIDER"), setAvailability);
export default router;