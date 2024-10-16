import user from "../../model/user.js";
import connectDB from "../../utils/connectDB.js";

// To validate the withdrawal amount
export async function validateWithdrawalAmount(req, res) {
    const { email, withdrawAmount, withdrawAsset } = await req.body;

    if (!email || !withdrawAmount || !withdrawAsset) {
        return res.status(400).json({
            result: "Invalid request",
            data: false,
        });
    }

    try {
        await connectDB();

        // Fetch the user assets
        const userAssets = await user.findOne({ email }, "userAssets");

        let assetWithUser;

        //Find the asset balance of the withdrawal assets
        userAssets.userAssets.forEach((item) => {
            if (item.asset.toLowerCase() === withdrawAsset.toLowerCase()) {
                assetWithUser = item;
            }
        });

        // Check if the user has enough balance
        if (assetWithUser.amount < withdrawAmount) {
            return res.status(400).json({
                result: "You do not have enough balance to make this withdrawal",
                data: false,
            });
        }

        if (assetWithUser.amount >= withdrawAmount) {

            return res.status(200).json({
                result: "Valid withdrawal",
                data: true,
            });
        }
    } catch (error) {
        return res.status(500).json({ result: "Internal server error" });
    }
}
