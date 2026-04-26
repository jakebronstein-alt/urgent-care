import { Router, type IRouter } from "express";
import { findClinicById, listClinics } from "../lib/db-queries";

const router: IRouter = Router();

router.get("/clinics", async (req, res) => {
  const { state, city, search, limit, offset } = req.query as Record<string, string | undefined>;

  const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 20;
  const parsedOffset = offset !== undefined ? parseInt(offset, 10) : 0;

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    res.status(400).json({ error: "Invalid limit: must be an integer between 1 and 100" });
    return;
  }
  if (isNaN(parsedOffset) || parsedOffset < 0) {
    res.status(400).json({ error: "Invalid offset: must be a non-negative integer" });
    return;
  }

  try {
    const clinics = await listClinics({ state, city, search, limit: parsedLimit, offset: parsedOffset });
    res.json({ clinics });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to list clinics: ${message}` });
  }
});

router.get("/clinics/:id", async (req, res) => {
  const { id } = req.params;

  if (!id || typeof id !== "string" || id.trim() === "") {
    res.status(400).json({ error: "Missing clinic id" });
    return;
  }

  try {
    const clinic = await findClinicById(id);
    if (!clinic) {
      res.status(404).json({ error: "Clinic not found" });
      return;
    }
    res.json({ clinic });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to fetch clinic: ${message}` });
  }
});

export default router;
