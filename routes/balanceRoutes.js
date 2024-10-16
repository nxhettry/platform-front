import express from 'express';
import { updateBalanceDepoWithdraw, getBalance } from "../controller/wallet/balanceController.js";

const router = express.Router();

router.post("/updateBalance", updateBalanceDepoWithdraw);
router.post("/getBalance", getBalance);

export default router;