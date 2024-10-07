import express from "express";
import { adAssetManually } from "../controller/adminTopupController.js";

const router = express.Router();

router.post("/topup", adAssetManually);

export default router;