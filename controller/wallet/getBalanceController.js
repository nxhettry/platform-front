import user from "@/model/user";
import connectDB from "@/app/utils/connectDB";

export async function getBalance(req, res) {
    const body = await request.body;
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
