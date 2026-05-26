import { Router, type IRouter } from "express";
import healthRouter from "./health";
import errandsRouter from "./errands";
import helpersRouter from "./helpers";
import categoriesRouter from "./categories";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(errandsRouter);
router.use(helpersRouter);
router.use(categoriesRouter);
router.use(notificationsRouter);

export default router;
