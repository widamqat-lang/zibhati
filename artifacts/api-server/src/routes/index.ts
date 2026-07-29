import { Router, type IRouter } from "express";
import adminRouter from "./admin";
import devicesRouter from "./devices";
import healthRouter from "./health";
import ordersRouter from "./orders";
import presenceRouter from "./presence";
import productsRouter from "./products";
import storefrontRouter from "./storefront";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storefrontRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(presenceRouter);
router.use(devicesRouter);
router.use(adminRouter);

export default router;
