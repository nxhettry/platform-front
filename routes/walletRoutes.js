import express from 'express';
import {validateWithdrawalAmount} from "../controller/wallet/validateWithdrawalController.js";
import {submitWithdrawal} from "../controller/wallet/withdrawController.js";
import {saveTransactions} from "../controller/wallet/saveTransactionController.js";
import {getUserTransactions} from "../controller/wallet/getUserTransactionController.js";
import {createBscWallet, getBscWallet} from "../controller/wallet/cryptonetwork/bscWalletController.js";

const router = express.Router();

router.post("/createBscWallet", createBscWallet);
router.post("/getBscWallet", getBscWallet);
router.post("/createWithdrawal", submitWithdrawal);
router.post("/validateWithdrawal", validateWithdrawalAmount);
router.post("/saveTransactions", saveTransactions);
router.post("/getUserTransactions", getUserTransactions);

export default router;