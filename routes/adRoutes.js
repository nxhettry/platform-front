import express from "express";
import { postNewAd, getAllBuyAds, getAllSellAds, getFilteredAdsMob, validateAsset, getMyAds,updateStatus, editAd, deleteAd } from "../controller/p2p/adController.js";

const router = express.Router();

router.post("/postad", postNewAd);
router.post("/getallad/myads/mobile", getFilteredAdsMob);
router.get("/getallad/myads", getMyAds);
router.get("/getallad/buy", getAllBuyAds);
router.get("/getallad/sell", getAllSellAds);
router.post("/validateAsset", validateAsset);
router.post("/updatead/edit", editAd);
router.post("/updatead/delete", deleteAd);
router.post("/updatead/status", updateStatus);

export default router;  