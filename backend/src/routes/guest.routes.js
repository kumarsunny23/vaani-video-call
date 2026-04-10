import { Router } from "express";
import { generateGuestToken, validateGuestToken } from "../controllers/guestToken.controller.js";

const router = Router();

router.route("/generate").post(generateGuestToken);
router.route("/validate").post(validateGuestToken);

export default router;
