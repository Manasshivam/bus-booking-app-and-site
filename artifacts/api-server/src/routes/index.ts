import { Router, type IRouter } from "express";
import healthRouter from "./health";
import busesRouter from "./buses";
import bookingsRouter from "./bookings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(busesRouter);
router.use(bookingsRouter);

export default router;
