import express from 'express';
import { getInfo, updateUsername } from "../controller/usercenter/userController.js";

const router = express.Router();

router.post("/getUserInfo", getInfo);
router.post("/updateUsername", updateUsername);

export default router;