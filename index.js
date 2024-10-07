import express from 'express';
import bodyParser from 'body-parser';
import cors from "cors";
import adRoutes from './routes/adRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import bonusRoutes from './routes/bonusRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import p2pOrderRoutes from './routes/p2pOrderRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 8080;
app.use(bodyParser.json());
app.use(cors());

app.use("/api/p2p/ad", adRoutes);
app.use("/api/usercenter", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/admin", bonusRoutes);
app.use("/api/usercenter/payment", paymentRoutes);
app.use("/api/p2p/order", p2pOrderRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});