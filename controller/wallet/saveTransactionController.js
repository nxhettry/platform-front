import user from '../../model/user.js';
import connectDB from '../../utils/connectDB.js';

// To save the user's transactions
export async function saveTransactions(req, res) {
    const { transactions, userWallet, email } = await req.body;

    // Check if transactions have been provided
    if (!transactions || transactions.length === 0) {
        return res.status(400).json({ message: "No transactions provided." });
    }

    // Filter out transactions involving the hot wallet
    const hotWalletAddress = process.env.BSC_HOT_WALLET_ADDRESS.toLowerCase();
    const filteredTransactions = transactions.filter(transaction =>
        transaction.to.toLowerCase() !== hotWalletAddress &&
        transaction.from.toLowerCase() !== hotWalletAddress
    );

    if (!filteredTransactions.length) {
        return res.status(400).json({ message: "No valid transactions." });
    }

    // Connect to the database
    await connectDB();

    // Find the user
    const userExist = await user.findOne({ $or: [{ email }, { username: userWallet }] });
    if (!userExist) {
        return res.status(404).json({ message: "User not found" });
    }

    // Get the saved transaction hashes
    const savedTransactionHashes = new Set(userExist.transactions.map(transaction => transaction.transactionHash));

    // Filter out transactions that have already been saved
    const newTransactions = filteredTransactions.filter(transaction =>
        !savedTransactionHashes.has(transaction.hash)
    );

    if (!newTransactions.length) {
        return res.status(200).json({ message: "Transactions already saved" });
    }

    // Process new transactions
    const transactionsData = newTransactions.map(transaction => {
        const isDeposit = transaction.to.toLowerCase() === userWallet.toLowerCase();
        const isWithdraw = transaction.from.toLowerCase() === userWallet.toLowerCase();
        const amount = transaction.value / 1e18;
        const asset = transaction.tokenSymbol === "BSC-USD" ? "USDT" : "BNB";

        // Find the user's asset
        const userAsset = userExist.userAssets.find(item => item.asset.toLowerCase() === asset.toLowerCase());
        const currentBalance = userAsset ? parseFloat(userAsset.amount) : 0;

        // Update the user's balance based on the transaction type
        if (isDeposit) {
            userAsset.amount = (currentBalance + amount).toString(); // Increase balance on deposit
        } else if (isWithdraw) {
            if (currentBalance >= amount) {
                userAsset.amount = (currentBalance - amount).toString(); // Decrease balance on withdrawal
            }
        }

        return {
            kind: isDeposit ? "deposit" : "withdraw",
            amount,
            asset,
            transactionHash: transaction.hash,
            date: new Date(transaction.timeStamp * 1000),
            status: transaction.isError === "0" ? "completed" : "failed",
        };
    });

    // Save the new transactions and update the user document
    userExist.transactions.push(...transactionsData);
    await userExist.save();

    return res.status(200).json({ message: "Transactions saved successfully" });
}
