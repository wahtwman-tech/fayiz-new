import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import settingsRouter from "./settings";
import pagesRouter from "./pages";
import sectionsRouter from "./sections";
import servicesRouter from "./services";
import projectsRouter from "./projects";
import navRouter from "./nav";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(settingsRouter);
router.use(pagesRouter);
router.use(sectionsRouter);
router.use(servicesRouter);
router.use(projectsRouter);
router.use(navRouter);
router.use(contactRouter);

export default router;
