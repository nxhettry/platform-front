import connectDB from "../utils/connectDB.js";
import user from "../model/user.js";


// This function is used to authenticate the user login
export async function handleLogin(req, res) {
    try {
        const { email, password } = await req.body;


        await connectDB();


        // Find the user
        const userExists = await user.findOne({ email: email, password: password });
        if (userExists) {

            return res.status(200).json({
                message: "User authenticated successfully",
            });
        } else {
            return res.status(400).json({
                message: "User Authentication Failed",
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "An error occurred in post API in the login route",
        });
    }
}

// This function is used to register the user
export async function handleRegister(req, res) {
    const { email, password, login } = await req.body;

    // Check if email is valid
    if (!email || !email.trim()) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        await connectDB();

        // Check if user exists
        const userExists = await user.findOne({ email: email.trim() });

        if (login) {
            // Handle login logic
            if (userExists) {
                return res.status(200).json({ message: "Login successful" });
            } else {
                // Handle user creation during login
                const newUser = new User({
                    email: email.trim(),
                    password: password?.trim(),
                    username: email.trim().split("@")[0],
                    userAssets: [
                        { asset: "BTC", amount: 0 },
                        { asset: "USDT", amount: 0 },
                        { asset: "ETH", amount: 0 },
                        { asset: "BNB", amount: 0 },
                    ],
                    frozenUserAssets: [
                        { asset: "BTC", amount: 0 },
                        { asset: "USDT", amount: 0 },
                        { asset: "ETH", amount: 0 },
                        { asset: "BNB", amount: 0 },
                    ],
                });

                const result = await newUser.save();

                if (!result) {
                    return res.status(500).json({
                        message: "An error occurred while saving the user",
                    });
                }

                return res.status(200).json({
                    message: "Logged in successfully",
                });
            }
        } else {
            // Handle signup logic
            if (userExists) {
                return res.status(400).json({
                    message: "User already exists",
                });
            } else {
                // Create a new user
                const newUser = new user({
                    email: email.trim(),
                    password: password?.trim(),
                    username: email.trim().split("@")[0],
                    userAssets: [
                        { asset: "BTC", amount: 0 },
                        { asset: "USDT", amount: 0 },
                        { asset: "ETH", amount: 0 },
                        { asset: "BNB", amount: 0 },
                    ],
                    frozenUserAssets: [
                        { asset: "BTC", amount: 0 },
                        { asset: "USDT", amount: 0 },
                        { asset: "ETH", amount: 0 },
                        { asset: "BNB", amount: 0 },
                    ],
                });

                const result = await newUser.save();

                if (!result) {
                    return res.status(500).json({
                        message: "An error occurred while saving the user",
                    });
                }

                return res.status(200).json({
                    message: "User created successfully",
                });
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "An error occurred in the API",
        });
    }
}
