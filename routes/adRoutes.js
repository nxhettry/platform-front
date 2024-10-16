import express from "express";
import { postNewAd, getAllBuyAds, getAllSellAds, getFilteredAdsMob, validateAsset, getMyAds } from "../controller/p2p/adController.js";

const router = express.Router();

router.post("/postad", postNewAd);
router.post("/getallad/myads/mobile", getFilteredAdsMob);
router.get("/getallad/myads", getMyAds);
router.get("/getallad/buy", getAllBuyAds);
router.get("/getallad/sell", getAllSellAds);
router.post("/validateAsset", validateAsset);

export default router;