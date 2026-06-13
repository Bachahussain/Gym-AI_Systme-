import express from 'express';
const router = express.Router();

import login from "../controllers/login.js";
import signup from "../controllers/signup.js";
import logout from "../controllers/logout.js";
import { sendOtp } from "../controllers/sendOtp.js";
import { verifyOtp } from "../controllers/verifyOtp.js";

router.post('/login', login);
router.post("/signup",signup);
router.post("/logout", logout);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);


export default router;