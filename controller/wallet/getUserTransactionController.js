import user from '../../model/user.js';
import connectDB from '../../utils/connectDB.js';


//To get the user's transactions
export async function getUserTransactions(req, res) {
    const { email } = await req.body;

    try {
        await connectDB();

        // Find user by email or username
        const userExist = await user.findOne({ $or: [{ email }, { username: email }] });

        // Check if user exists
        if (!userExist) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if transactions exist
        const transactions = userExist.transactions || [];
        if (transactions.length === 0) {
            return res.status(404).json({ message: "No transactions found" });
        }

        return res.status(200).json({ transactions });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}
