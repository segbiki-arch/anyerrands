import { Router, type IRouter } from "express";
import healthRouter from "./health";
import errandsRouter from "./errands";
import helpersRouter from "./helpers";
import categoriesRouter from "./categories";
import notificationsRouter from "./notifications";
import stripeRouter from "./stripe";
import authRouter from "./auth";
import reportsRouter from "./reports";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(errandsRouter);
router.use(helpersRouter);
router.use(categoriesRouter);
router.use(notificationsRouter);
router.use(stripeRouter);
router.use(reportsRouter);
router.use(adminRouter);

export default router;
