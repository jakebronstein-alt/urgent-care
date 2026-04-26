import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clinicsRouter from "./clinics";
import waitTimesRouter from "./wait-times";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clinicsRouter);
router.use(waitTimesRouter);
router.use(reviewsRouter);

export default router;
