import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clinicsRouter from "./clinics";
import waitTimesRouter from "./wait-times";
import reviewsRouter from "./reviews";
import followUpRouter from "./follow-up";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clinicsRouter);
router.use(waitTimesRouter);
router.use(reviewsRouter);
router.use(followUpRouter);

export default router;
