import express from 'express';
import { createP2POrder, cancelP2POrder, createSwiftBuy, getAllOrders, getThisOrder, getOrderStatus, releaseCrypto } from "../controller/p2p/orderController.js";

const router = express.Router();

router.post("/createP2POrder", createP2POrder);
router.post("/cancelP2POrder", cancelP2POrder);
router.post("/createSwiftBuy", createSwiftBuy);
router.post("/getAllOrders", getAllOrders);
router.post("/getThisOrder", getThisOrder);
router.post("/getOrderStatus", getOrderStatus);
router.post("/releaseCrypto", releaseCrypto);

export default router;