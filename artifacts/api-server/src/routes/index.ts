import { Router, type IRouter } from "express";
import healthRouter from "./health";
import errandsRouter from "./errands";
import helpersRouter from "./helpers";
import categoriesRouter from "./categories";
import notificationsRouter from "./notifications";
import stripeRouter from "./stripe";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(errandsRouter);
router.use(helpersRouter);
router.use(categoriesRouter);
router.use(notificationsRouter);
router.use(stripeRouter);

export default router;
