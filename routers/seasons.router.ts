import { Router } from "express";
import { getAllSeasons, createSeason, updateSeason, deleteSeason } from "../controllers/seasons.js";
import { adminPrivilege, authenticate, requireVerified } from "../middlewares/auth.js";

const adminRoutes = [authenticate, requireVerified, adminPrivilege];
const router: Router = Router();

// Route to get all seasons
router.get("/", authenticate, requireVerified, getAllSeasons);

// Route to create a new season
router.post("/create", ...adminRoutes, createSeason);
router.put("/update/:id", ...adminRoutes, updateSeason);
router.delete("/delete/:id", ...adminRoutes, deleteSeason);

export default router;