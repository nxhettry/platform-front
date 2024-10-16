import user from "../../model/user.js";
import connectDB from "../../utils/connectDB.js";

// To get the user's information
export async function getInfo(req, res) {
    const { email } = await req.body;

    if (!email) {
        return res.status(400).json({
            message: "Please refresh the page or Login again",
        });
    }

    try {

        await connectDB();

        const userInfo = await user.findOne({ email });

        if (!userInfo) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            data: userInfo,
            message: "User info fetched successfully",
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// To update the username
export async function updateUsername(req, res) {
    const { email, username } = await req.body;

    if (!email || !username) {
        return res.status(400).json({
            message: "Please refresh the page or Login again",
        });
    }

    try {
        await connectDB();
        const userInfo = await user.findOneAndUpdate(
            { email },
            { username },
            { new: true }
        );

        if (!userInfo) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            data: userInfo,
            message: "Username updated successfully",
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
