import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const p2pOrderSchema = new Schema({
  orderid: { type: String, default: uuidv4, unique: true },
  adId: { type: String },
  orderdetails: {
    adId: String,
    fiatAmount: Number,
    price: Number,
    totalAsset: Number,
    paymentDetails: [{}],
    currency: String,
    asset: String,
    type: { type: String, enum: ["buy", "sell"] },
  },
  isComplete: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  isCancelled: { type: Boolean, default: false },
  isDisputed: { type: Boolean, default: false },
  isRefunded: { type: Boolean, default: false },
  isPending: { type: Boolean, default: true },
  isExpired: { type: Boolean, default: false },
  cancelReason: { type: String },
  timer: { type: Number, default: 0 },
  buyer: { type: Schema.Types.ObjectId, ref: "User" },
  seller: { type: Schema.Types.ObjectId, ref: "User" },
  messages: [
    {
      sender: { type: Schema.Types.ObjectId, ref: "User" }, // Sender's ID (buyer or seller)
      message: { type: String, required: true }, // Message text
      timestamp: { type: Date, default: Date.now }, // Timestamp
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.p2pOrder ||
  mongoose.model("p2pOrder", p2pOrderSchema);
