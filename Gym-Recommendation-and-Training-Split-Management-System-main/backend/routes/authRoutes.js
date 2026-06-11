import express from 'express';
const router = express.Router();

import login from "../controllers/authControllers/login.js";
import signup from "../controllers/authControllers/signup.js";
import logout from "../controllers/authControllers/logout.js";
import { sendOtp } from "../controllers/authControllers/sendOtp.js";
import { verifyOtp } from "../controllers/authControllers/verifyOtp.js";

router.post('/login', login);
router.post("/signup",signup);
router.post("/logout", logout);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);


export default router;