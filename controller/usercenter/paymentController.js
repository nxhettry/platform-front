import user from "../../model/user.js";
import connectDB from "../../utils/connectDB.js";


// To add new payment method
export async function addPaymentMethod(req, res) {
    try {
        const { input, email } = await req.body;

        if (!input || !email) {
            return res.status(400).json({ message: "Invalid input" });
        }

        await connectDB();
        const userExist = await user.findOne({ email });

        if (!userExist) {
            return res.status(404).json({ message: "User not found" });
        }

        const result = userExist.paymentMethods.push(input);
        await userExist.save();

        return res.status(200).json({ message: "Payment method added", data: result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

// To get all payment methods
export async function getPaymentMethod(req, res) {
    try {
        const { email } = await req.body;

        if (!email) {
            return res.status(400).json({ message: "Invalid input" });
        }

        await connectDB();
        const userExist = await user.findOne({ email });

        if (!userExist) {
            return res.status(404).json({ message: "User not found" });
        }

        const result = userExist.paymentMethods;

        if (!res) {
            return res.status(404).json({
                message: "No payment methods found",
            });
        }

        return res.status(200).json({
            data: result,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}
