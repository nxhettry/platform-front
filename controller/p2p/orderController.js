import user from "../../model/user.js";
import connectDB from "../../utils/connectDB.js";
import p2pOrder from "../../model/p2porder.js";

// To create a new p2p order
export async function createP2POrder(req, res) {
    try {
        const data = await req.body;

        let requestAsset = data.orderdetails.asset;

        // Connect to the database
        await connectDB();

        // Find the two users i.e. buyer and seller
        const buyer = await user.findOne({
            $or: [{ username: data.buyer }, { email: data.buyer }],
        });
        const seller = await user.findOne({
            $or: [{ username: data.seller }, { email: data.seller }],
        });

        if (!buyer && !seller) {
            return res.status(404).json({
                message: "Buyer or Seller not found",
            });
        }

        const theAdId = data.adId.toString();

        // // Create a new order
        const newOrder = new p2pOrder({
            orderid: data.orderid,
            adId: theAdId,
            orderdetails: data.orderdetails,
            isComplete: false,
            isPaid: false,
            isCancelled: false,
            isDisputed: false,
            isRefunded: false,
            isPending: true,
            isExpired: false,
            timer: data.timer,
            buyer: buyer._id,
            seller: seller._id,
            messages: [],
        });

        // Freeze the amount the seller is selling
        const sellerAsset = seller.userAssets;
        const activeAsset = sellerAsset.find(
            (asset) => asset.asset === requestAsset
        );

        const sellerFrozenAsset = seller.frozenUserAssets;
        const toFreezeAsset = sellerFrozenAsset.find(
            (asset) => asset.asset === requestAsset
        );

        if (!activeAsset || !toFreezeAsset) {
            return res.status(404).json({
                message: "Asset not found",
            });
        }

        // Freezing the sell amount
        activeAsset.amount -= data.orderdetails.totalAsset;
        toFreezeAsset.amount += data.orderdetails.totalAsset;

        // Save the seller
        await seller.save();

        //Save the new order
        const result = await newOrder.save();

        // Return a success message
        return res.status(200).json({
            message: "Order created successfully",
            data: result.orderid.toString(),
        });
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// To cancel a p2p order
export async function cancelP2POrder(req, res) {
    const { orderId, reason } = await req.body;

    if (!orderId) {
        return res.status(400).json({ message: "Invalid request" });
    }
    try {
        await connectDB();

        const order = await p2pOrder.findOne({ orderid: orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.isComplete = false;
        order.isPaid = false;
        order.isCancelled = true;
        order.isDisputed = false;
        order.isRefunded = false;
        order.isPending = false;
        order.isExpired = false;
        order.cancelReason = reason;

        await order.save();

        return res.status(200).json({
            message: "Order Cancelled",
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

// To create swift p2p order
export async function createSwiftBuy(req, res) {
    const { email, amount, currency, paymentMethod } = await req.body;

    if (!email || !amount || !currency || !paymentMethod) {
        return res.status(400).json({
            message: "Missing required fields",
        });
    }

    try {
        await connectDB();

        // Searching for the user
        const userExists = await user.findOne({ email: email });

        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        //Getting all the ads

        const usersWithAds = await user.find({}, { p2pAd: 1 });

        if (usersWithAds.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        // Extract all buy ads
        const buyAds = usersWithAds.flatMap((user) =>
            user.p2pAd.filter((ad) => ad.type === "sell" && ad.status === "Online")
        );

        if (buyAds.length === 0) {
            return res.status(404).json({
                message: "No 'buy' ads found",
            });
        }

        // Filter the ads based on the currency and payment method
        const filterAdsWithCurrency = buyAds.filter((ad) => {
            return (
                ad.currency === currency &&
                ad.orderLimitfrom <= amount &&
                ad.orderLimitTo >= amount
            );
        });

        // Filter the ads based on payment methods and finding the one with lowest price
        let bestAd = null;

        filterAdsWithCurrency.forEach((ad) => {
            // Check if the ad has a matching payment method
            if (ad.paymentMethod.some((pm) => paymentMethod.includes(pm.method))) {
                // If bestAd is null or current ad has a lower price, update bestAd
                if (!bestAd || ad.price < bestAd.price) {
                    bestAd = ad;
                }
            }
        });

        if (!bestAd) {
            return res.status(400).json({ message: "No Ads found" });
        }

        //Getting uid of both buyer and seller
        const buyerUid = userExists._id;
        const seller = await user.findOne({
            $or: [{ email: bestAd.email }, { username: bestAd.email }],
        });
        const sellerUid = seller._id;

        //Creating a P2P order with the best price
        const orderDetails = {
            adId: bestAd._id,
            currency: bestAd.currency,
            asset: bestAd.asset,
            fiatAmount: amount,
            price: bestAd.price,
            totalAsset: amount / bestAd.price,
            paymentDetails: [
                {
                    paymentMethod: bestAd.paymentMethod,
                },
            ],
        };

        const orderData = new p2pOrder({
            adId: bestAd._id.toString(),
            orderdetails: orderDetails,
            isComplete: false,
            isPaid: false,
            isCancelled: false,
            isDisputed: false,
            isRefunded: false,
            isPending: true,
            isExpired: false,
            timer: bestAd.timeLimitinmins,
            buyer: buyerUid,
            seller: sellerUid,
            messages: [],
        });

        const result = await orderData.save();

        return res.status(200).json({
            message: "Order Created Succesfully",
            data: result.orderid.toString(),
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

// To get all p2p orders
export async function getAllOrders(req, res) {
    const { email } = await req.body;

    try {
        await connectDB();

        const userExist = await user.findOne({ email });
        if (!userExist) {
            return res.status(400).json({ message: "User not found" });
        }

        const userId = userExist._id.toString();

        const allOrders = await p2pOrder.find({ $or: [{ buyer: userId }, { seller: userId }] });

        if (allOrders.length === 0) {
            return res.status(400).json({ message: "Order not found" });
        }

        return res.status(200).json({ data: allOrders, message: "Order found", userId: userId });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// To get a specific order
export async function getThisOrder(req, res) {
    const { email, orderid } = await req.body;


    if(!orderid){
        return res.status(400).json({ message: "Invalid request" });
    }

    try {
        await connectDB();

        const userExist = await user.findOne({ email });
        if (!userExist) {
            return res.status(400).json({ message: "User not found" });
        }

        const order = await p2pOrder.find({ orderid });

        if (order.length === 0) {
            return res.status(400).json({ message: "Order not found" });
        }

        const uid = userExist._id.toString();
        let isBuyer, isSeller;

        if (order[0].buyer.toString() === uid) {
            isBuyer = true;
        } else {
            isBuyer = false;
        }

        if (order[0].seller.toString() === uid) {
            isSeller = true;
        } else {
            isSeller = false;
        }

        return res.status(200).json({
            data: order,
            isBuyer,
            isSeller,
            message: "Order found",
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// To get order status
export async function getOrderStatus(req, res) {
    const body = await req.body;

    const { orderid, status } = body;

    if (!orderid || !status) {
        return res.status(400).json({ message: "Invalid request" });
    }

    try {
        await connectDB();

        const order = await p2pOrder.findOne({ orderid });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        switch (status) {
            case "isPaid":
                order.isPaid = true;
                break;
            case "isComplete":
                order.isComplete = true;
                break;
            case "isDisputed":
                order.isDisputed = true;
                break;
            case "isCancelled":
                order.isCancelled = true;
                break;
            case "isPending":
                order.isPending = false;
                break;
            case "isRefunded":
                order.isRefunded = true;
                break;
            case "isExpired":
                order.isExpired = true;
                break;
            default:
                return res.status(400).json({
                    message: "Invalid status passed to the api",
                });
        }

        await order.save();

        return res.status(200).json({ message: "Order status updated" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

// To release crypto
export async function releaseCrypto(req, res) {
    const body = await req.body;
    const { orderid } = body;

    if (!orderid) {
        return res.status(400).json({ message: "Invalid request" });
    }

    try {
        await connectDB();

        // Find the order using the order ID
        const order = await p2pOrder.findOne({ orderid });

        const adId = await order.adId;

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Access order details
        const { asset, totalAsset } = order.orderdetails; // Access the asset and total asset
        const { buyer, seller } = order; // Get the buyer's ID

        // Fetch the buyer's information
        const buyerInfo = await user.findById(buyer);

        // Fetch the seller's information
        const sellerInfo = await user.findById(seller);

        if (!buyerInfo) {
            return res.status(404).json({ message: "Buyer not found" });
        }

        if (!sellerInfo) {
            return res.status(404).json({ message: "Seller not found" });
        }

        // Find the buyer balance for the specific asset
        const buyerAsset = buyerInfo.userAssets.find(
            (item) => item.asset === asset
        );

        // Find the seller balance for the specific asset
        let sellerAsset = sellerInfo.frozenUserAssets.find(
            (item) => item.asset === asset
        );

        if (!buyerAsset) {
            return res.status(400).json({
                message: `Asset ${asset} not found in buyer's assets`,
            });
        }

        if (!sellerAsset) {
            return res.status(400).json({
                message: `Asset ${asset} not found in seller's assets`,
            });
        }

        //Deduct the amount from the seller's's balance
        sellerAsset.amount -= totalAsset;

        // Add the amount from the buyer's balance
        buyerAsset.amount += totalAsset;

        // Checking where the ad is from
        const sellerAd = sellerInfo.p2pAd.find((ad) => ad._id == adId);
        const buyerAd = buyerInfo.p2pAd.find((ad) => ad._id == adId);

        if (sellerAd) {
            sellerAd.amount -= totalAsset;
        }

        if (buyerAd) {
            buyerAd.amount -= totalAsset;
        }

        if (!sellerAd && !buyerAd) {
            return res.status(400).json({
                message: `available ad not updated`,
            });
        }

        // Save the updated buyer's balance
        await buyerInfo.save();

        // Save the updated seller's balance
        await sellerInfo.save();

        // Construct response data
        const responseData = {
            asset,
            totalAsset,
        };

        order.isComplete = true;
        order.isPending = false;

        await order.save();

        return res.status(200).json({ data: responseData });
    } catch (error) {
        console.error("Error processing request:", error); // Improved logging
        return res.status(500).json({ message: "Internal server error" });
    }
}