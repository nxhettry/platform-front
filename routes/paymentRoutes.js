import express from 'express';
import { addPaymentMethod, getPaymentMethod } from "../controller/usercenter/paymentController.js";

const router = express.Router();

router.post("/addPaymentMethod", addPaymentMethod);
router.post("/getAll", getPaymentMethod);

export default router;