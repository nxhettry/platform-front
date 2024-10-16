import user from "../../model/user.js";
import connectDB from "../../utils/connectDB.js";
import Withdrawal from "../../model/withdrawals.js";

// To submit the withdrawal to the admin panel
export async function submitWithdrawal(req, res) {
    const { email, withdrawAmount, withdrawAsset, withdrawAddress } = req.body;

    try {
        await connectDB();

        // Look for the user in the database
        const userExist = await user.findOne({ email: email });

        if (!userExist) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // create a new withdrawal request
        const withdrawal = new Withdrawal({
            user: userExist,
            toAddress: withdrawAddress,
            amount: withdrawAmount,
            asset: withdrawAsset,
        });

        await withdrawal.save();

        return res.status(200).json({
            message: "Withdrawal request submitted",
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
}
