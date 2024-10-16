import user from "../../model/user.js";
import Withdrawal from "../../model/withdrawals.js";
import connectDB from "../../utils/connectDB.js";


//To update the user's balance after deposit or withdrawal
export async function updateBalanceDepoWithdraw(req, res) {
    const { hash, amount, type, email, asset } = await req.body;

    if (!hash || !amount || !type || !email || !asset) {
        return res.status(400).json({ message: "Bad request" });
    }

    try {
        await connectDB();
        const userExist = await user.findOne({ email });

        if (!userExist) {
            return res.status(404).json({ message: "User not found" });
        }

        const userAssets = userExist.userAssets;

        let depositAsset;

        if (asset === "BSC-USD") {
            depositAsset = "USDT";
        } else if (asset === "BNB") {
            depositAsset = "BNB";
        }

        // Retrieve the user's transaction hashes
        const transactionHash = userExist.transactionHash;

        // If this is the first deposit or withdraw, add the transaction hash
        if (!transactionHash || transactionHash.length === 0) {
            // Update the user's transaction hash
            let hashString = hash.toString();
            await userExist.transactionHash.push(hashString);

            // Find the depositAsset in the user's assets
            const assetExist = userAssets.find(
                (asset) => asset.asset === depositAsset
            );

            if (!assetExist) {
                return res.status(404).json({ message: "Asset not found" });
            }

            //Update the user's balance
            if (type === "deposit") {
                assetExist.amount += amount;
            }

            if (type === "withdraw") {

                Withdrawal.create({
                    user: userExist,
                    amount: amount,
                    asset: asset,
                });

                console.log("Withdrawal created");

                assetExist.amount -= amount;
            }

            await userExist.save();

            await Withdrawal.save();

            return res.status(200).json({
                message: "Transaction hash added",
            });
        }

        // Check if the transaction hash already exists
        const hashExists = transactionHash.includes(hash);

        if (hashExists) {
            return res.status(409).json({ message: "Transaction hash already exists" });
        }


        // Update the user's transaction hash
        let hashString = hash.toString();
        await userExist.transactionHash.push(hashString);

        // Find the depositAsset in the user's assets
        const assetExist = userAssets.find((asset) => asset.asset === depositAsset);

        if (!assetExist) {
            return res.status(404).json({ message: "Asset not found" });
        }

        //Update the user's balance

        if (type === "deposit") {
            assetExist.amount += amount;
        }

        if (type === "withdraw") {
            assetExist.amount -= amount;
        }

        await userExist.save();

        return res.status(200).json({ message: "Transaction hash added" });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}


// To get user's balance
export async function getBalance(req, res) {
    const body = await req.body;
    const { email } = body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {

        await connectDB();

        // Find the user by email
        const userExists = await user.findOne({ email });
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }
        const { userAssets } = userExists;

        if (!userAssets || userAssets.length === 0) {
            return res.status(200).json({ message: "No assets found" });
        }

        return res.status(200).json({
            message: "Success fetching assets",
            data: userAssets,
        });
    } catch (error) {
        console.error("Error fetching user assets:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
