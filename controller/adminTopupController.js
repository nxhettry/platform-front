import connectDB from "../utils/connectDB.js";
import user from "../model/user.js";

//To topup the balance manually
export async function adAssetManually (req, res) {
    const data = await req.body;
    const { email, asset, amount } = data;

    try {
        await connectDB();

        const userExists = await user.findOne({ email });

        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        // finding the user's asset
        const userAsset = userExists.userAssets.find((a) => a.asset === asset);

        // adding asset
        userAsset.amount += parseInt(amount);

        await userExists.save();

        return res.status(200).json({ message: "Asset added successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}
