import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const UserSchema = new Schema({
  emailGoogle: { type: String },
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: { type: String },
  date: { type: Date, default: Date.now },
  address: { type: String },
  privateKey: { type: String },
  qrCodeUrl: { type: String },
  phoneNumber: { type: String },
  country: { type: String },
  paymentMethods: [{}],
  totalOrders: { type: Number, default: 0 },
  totalCompletedOrders: { type: Number, default: 0 },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  transactions: [{
    kind: { type: String, enum: ["deposit", "withdraw"] },
    amount: { type: Number },
    asset: { type: String },
    transactionHash: { type: String },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "completed", "failed"] },
  }],
  p2pAd: [
    {
      adId: { type: String, default: uuidv4 },
      uid: { type: Schema.Types.ObjectId, ref: "User" },
      email: { type: String },
      asset: { type: String },
      currency: { type: String },
      paymentMethod: [{}],
      price: { type: Number },
      amount: { type: Number },
      orderLimitfrom: { type: Number },
      orderLimitTo: { type: Number },
      timeLimitinmins: { type: Number },
      type: { type: String, enum: ["buy", "sell"] },
      username: { type: String },
      orders: { type: Number },
      completionRate: { type: Number },
      status: { type: String, enum: ["Online", "Offline"] },
      terms: { type: String, default: "No terms provided" },
    },
  ],
  userAssets: [
    {
      asset: { type: String, enum: ["BTC", "USDT", "ETH", "BNB"] },
      amount: { type: Number, default: 0 },
    },
  ],
  frozenUserAssets: [
    {
      asset: { type: String, enum: ["BTC", "USDT", "ETH", "BNB"] },
      amount: { type: Number, default: 0 },
    },
  ],
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
