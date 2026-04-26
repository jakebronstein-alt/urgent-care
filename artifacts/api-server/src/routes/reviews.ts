import { Router, type IRouter } from "express";
import { findClinicById, upsertUserByEmail, createReview } from "../lib/db-queries";

const router: IRouter = Router();

router.post("/reviews", async (req, res) => {
  const { clinicId, phone, rating, body: reviewBody } = req.body as {
    clinicId?: string;
    phone?: string;
    rating?: unknown;
    body?: string;
  };

  if (!clinicId || !phone || rating === undefined || rating === null || !reviewBody) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const ratingNum = Number(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 10) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  try {
    const clinic = await findClinicById(clinicId);
    if (!clinic) {
      res.status(404).json({ error: "Clinic not found" });
      return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `DB lookup error: ${message}` });
    return;
  }

  try {
    const syntheticEmail = `${digits}@phone.ubiehealth`;
    const user = await upsertUserByEmail(syntheticEmail);

    await createReview({
      clinicId,
      userId: user.id,
      rating: ratingNum,
      body: reviewBody,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      res.status(409).json({ error: "You've already reviewed this clinic." });
      return;
    }
    res.status(500).json({ error: `Server error: ${message}` });
  }
});

export default router;
