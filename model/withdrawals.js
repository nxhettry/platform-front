import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const withdrawalSchema = new Schema({
    withdrawId: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toAddress: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    asset: {
        type: String,
        enum: ['USDT', 'BNB'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    txnHash: {
        type: String,
        default : "",
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;