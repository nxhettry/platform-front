import user from "../../model/user.js";
import connectDB from "../../utils/connectDB.js";

export async function postNewAd(req, res) {
  const data = await req.body;

  // Extracting the data from the request
  const {
    email,
    asset,
    currency,
    paymentMethod,
    price,
    amount,
    orderLimitfrom,
    orderLimitTo,
    timeLimitinmins,
    type,
    terms,
  } = data;

  // Check if all fields are provided and valid
  if (
    !email ||
    !asset ||
    !currency ||
    !paymentMethod ||
    !price ||
    !amount ||
    !orderLimitfrom ||
    !orderLimitTo ||
    !timeLimitinmins ||
    !type ||
    !terms
  ) {
    return res.status(400).json({
      message: "All fields are required and must be valid",
    });
  }

  try {
    await connectDB();

    // Check if the user exists or not
    const userExist = await user.findOne({ email });

    if (!userExist) {
      return res.status(404).json({
        message: "User not found in Database",
      });
    }

    // Check if the user has the asset they are trying to sell
    let availableAsset = userExist.userAssets.find(
      (userAsset) => userAsset.asset === asset
    );

    if (!availableAsset) {
      return res.status(404).json({
        message: "You do not have this asset available",
      });
    }

    let availableAmount = parseFloat(availableAsset.amount);
    const amountToSell = parseFloat(amount);

    // Check if the user is trying to sell more than they have
    if (type === "sell" && availableAmount < amountToSell) {
      return res.status(404).json({
        message: `Insufficient asset balance. Available: ${availableAmount}, Requested: ${amountToSell}`,
      });
    }

    // Check if the user has added the payment method(s) they are trying to use
    const userPaymentMethods = userExist.paymentMethods.map(
      (payment) => payment.method
    );

    // Check if every payment method from req.body exists in the user's payment methods
    const paymentMethodsExist = paymentMethod.every((method) =>
      userPaymentMethods.includes(method)
    );

    if (!paymentMethodsExist) {
      return res.status(404).json({
        message: "Please add all payment methods selected before posting an ad",
      });
    }

    const requestedPaymentMethods = paymentMethod;

    // Extract user payment methods details
    const userPaymentMethodsDetails = userExist.paymentMethods.filter(
      (payment) => requestedPaymentMethods.includes(payment.method)
    );

    // Initialize p2pAd if it doesn't exist
    if (!userExist.p2pAd) {
      userExist.p2pAd = [];
    }

    // Check if an ad with the same details already exists
    const adExists = userExist.p2pAd.some(
      (ad) =>
        ad.asset === asset &&
        ad.currency === currency &&
        ad.paymentMethod === paymentMethod &&
        ad.price === price &&
        ad.amount === amount &&
        ad.orderLimitfrom === orderLimitfrom &&
        ad.orderLimitTo === orderLimitTo &&
        ad.timeLimitinmins === timeLimitinmins &&
        ad.type === type &&
        ad.orders === orders &&
        ad.completionRate === completionRate &&
        ad.status === status
    );

    if (adExists) {
      return res.status(409).json({
        message: "An ad with the same details already exists",
      });
    }

    // Preparing data to be pushed to the p2pAd array
    const userOrders = userExist.totalOrders;
    const userCompletedOrders = userExist.totalCompletedOrders;
    let completeRate = 0;
    if (userOrders && userOrders > 0) {
      completeRate = (userCompletedOrders / userOrders) * 100;
    }

    // Push the new ad data to the p2pAd array
    userExist.p2pAd.push({
      email: userExist.username,
      asset,
      currency,
      paymentMethod: userPaymentMethodsDetails,
      price,
      amount,
      orderLimitfrom,
      orderLimitTo,
      timeLimitinmins,
      type,
      terms,
      orders: userOrders,
      completionRate: parseInt(completeRate),
      status: "Online",
    });

    //Deducting the asset from the user's account if they are selling
    if (type === "sell") {
      availableAsset.amount -= amountToSell;

      //Add the deducted asset to the frozenUserAssets
      let frozenAsset = userExist.frozenUserAssets.find(
        (userAsset) => userAsset.asset === asset
      );

      if (!frozenAsset) {
        userExist.frozenUserAssets.push({
          asset,
          amount: amountToSell,
        });
      } else {
        frozenAsset.amount += amountToSell;
      }
    }

    // Save the updated user document
    await userExist.save();

    return res.status(200).json({
      message: "Ad posted successfully",
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({
      message: "Failed to post ad",
    });
  }
}

// To get all buyAds
export async function getAllBuyAds(req, res) {
  try {
    await connectDB();

    // Fetch all users but only select the 'p2pad' field
    const usersWithAds = await user.find({}, { p2pAd: 1 });

    if (usersWithAds.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Extract all ads from all users and filter for 'type: buy'
    const buyAds = usersWithAds.flatMap((user) =>
      user.p2pAd.filter((ad) => ad.type === "sell" && ad.status === "Online")
    );

    if (buyAds.length === 0) {
      return res.status(404).json({
        message: "No 'buy' ads found",
      });
    }

    return res.status(200).json({
      message: "'Buy' ads fetched successfully",
      data: buyAds,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to fetch ads",
    });
  }
}

// To get all sellAds
export async function getAllSellAds(req, res) {
  try {
    await connectDB();

    // Fetch all users but only select the 'p2pad' field
    const usersWithAds = await user.find({}, { p2pAd: 1 });

    if (usersWithAds.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Extract all ads from all users and filter for 'type: buy'
    const buyAds = usersWithAds.flatMap((user) =>
      user.p2pAd.filter((ad) => ad.type === "buy" && ad.status === "Online")
    );

    if (buyAds.length === 0) {
      return res.status(404).json({
        message: "No 'buy' ads found",
      });
    }

    return res.status(200).json({
      message: "'Buy' ads fetched successfully",
      data: buyAds,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to fetch ads",
    });
  }
}

// To get all the users ads
export async function getMyAds(req, res) {
  // Extract dynamic data outside of the try/catch block
  const { email } = req.query;

  // Handle the absence of an email parameter early
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    await connectDB();

    const usersWithAds = await user.find(
      { email: email },
      { p2pAd: 1, _id: 1, date: 1 }
    );

    if (!usersWithAds || usersWithAds.length === 0) {
      return res.status(404).json({ message: "No ads found" });
    }

    const allAds = usersWithAds.map((user) => ({
      id: user._id,
      date: user.date,
      ads: user.p2pAd,
    }));

    return res.status(200).json({
      message: "All ads fetched successfully",
      data: allAds,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch ads",
    });
  }
}

// Get filtered ads for mobile
export async function getFilteredAdsMob(req, res) {
  const { email, filterStates } = await req.body;

  if (!email || !filterStates) {
    return res
      .status(400)
      .json({ message: "Email and filter states are required" });
  }

  try {
    //Connect to database
    await connectDB();

    //Look for users
    const userExists = await user.find({ email });

    //If user does not exist
    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { isBuy, isOnline, isOffline, isNPR, isINR, isAED, isUSD } =
      filterStates;

    //  Get all the ads from the selected user
    const usersWithAds = await user.find(
      { email },
      { p2pAd: 1, _id: 1, date: 1 }
    );

    //  If no ads are found
    if (!usersWithAds || usersWithAds.length === 0) {
      return res.status(404).json({
        message: "No ads found",
      });
    }

    //  gets all the ads from the user
    const allAds = usersWithAds.map((user) => ({
      id: user._id,
      date: user.date,
      ads: user.p2pAd,
    }));

    let extractedAds = [];

    //map and push all the ads to the extracted ads array
    allAds.forEach((ad) => {
      ad.ads.forEach((item) => {
        extractedAds.push(item);
      });
    });

    let result = [];

    //now check for the filter states and store the response in the result array

    //Checking the filter states for the buy button
    if (isBuy) {
      if (isOnline && !isOffline) {
        if (isNPR) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "buy" &&
              ad.status === "Online" &&
              ad.currency === "NPR"
            ) {
              result.push(ad);
            }
          });
        }
        if (isINR) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "buy" &&
              ad.status === "Online" &&
              ad.currency === "INR"
            ) {
              result.push(ad);
            }
          });
        }
        if (isAED) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "buy" &&
              ad.status === "Online" &&
              ad.currency === "AED"
            ) {
              result.push(ad);
            }
          });
        }
        if (isUSD) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "buy" &&
              ad.status === "Online" &&
              ad.currency === "USD"
            ) {
              result.push(ad);
            }
          });
        }
      }
      if (isOffline && !isOnline) {
        if (isNPR) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "buy" &&
              ad.status === "Offline" &&
              ad.currency === "NPR"
            ) {
              result.push(ad);
            }
          });
        }
        if (isINR) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "buy" &&
              ad.status === "Offline" &&
              ad.currency === "INR"
            ) {
              result.push(ad);
            }
          });
        }
        if (isAED) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "buy" &&
              ad.status === "Offline" &&
              ad.currency === "AED"
            ) {
              result.push(ad);
            }
          });
        }
        if (isUSD) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "buy" &&
              ad.status === "Offline" &&
              ad.currency === "USD"
            ) {
              result.push(ad);
            }
          });
        }
      }
    }

    //Checking the filter states for the sell button
    if (!isBuy) {
      if (isOnline && !isOffline) {
        if (isNPR) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "sell" &&
              ad.status === "Online" &&
              ad.currency === "NPR"
            ) {
              result.push(ad);
            }
          });
        }
        if (isINR) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "sell" &&
              ad.status === "Online" &&
              ad.currency === "INR"
            ) {
              result.push(ad);
            }
          });
        }
        if (isAED) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "sell" &&
              ad.status === "Online" &&
              ad.currency === "AED"
            ) {
              result.push(ad);
            }
          });
        }
        if (isUSD) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "sell" &&
              ad.status === "Online" &&
              ad.currency === "USD"
            ) {
              result.push(ad);
            }
          });
        }
      }
      if (isOffline && !isOnline) {
        if (isNPR) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "sell" &&
              ad.status === "Offline" &&
              ad.currency === "NPR"
            ) {
              result.push(ad);
            }
          });
        }
        if (isINR) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "sell" &&
              ad.status === "Offline" &&
              ad.currency === "INR"
            ) {
              result.push(ad);
            }
          });
        }
        if (isAED) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "sell" &&
              ad.status === "Offline" &&
              ad.currency === "AED"
            ) {
              result.push(ad);
            }
          });
        }
        if (isUSD) {
          extractedAds.forEach((ad) => {
            if (
              ad.type === "sell" &&
              ad.status === "Offline" &&
              ad.currency === "USD"
            ) {
              result.push(ad);
            }
          });
        }
      }
    }

    //  If no ads are found
    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "No ads found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "All ads fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

// Validate Seller Asset before creating an ad
export async function validateAsset(req, res) {
  const { toCheckAmount, userEmail, selectedAsset } = await req.body;

  if (!toCheckAmount || !userEmail || !selectedAsset) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    await connectDB();

    //Look for the seller in the DB
    const seller = await user.findOne({ email: userEmail });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Check the sellers asset
    const sellerAssets = seller.userAssets;

    if (!sellerAssets) {
      return res.status(404).json({
        message: "Seller assets not found",
      });
    }

    const currencyIndex = sellerAssets.findIndex(
      (item) => item.asset === selectedAsset
    );

    if (currencyIndex === -1) {
      return res.status(404).json({
        message: "Seller assets not found",
      });
    }

    const currency = sellerAssets[currencyIndex];

    if (currency.amount < toCheckAmount) {
      return res
        .status(200)
        .json({ message: "Insufficient balance", data: false });
    }

    if (currency.amount >= toCheckAmount) {
      return res.status(200).json({ message: "Order Created", data: true });
    }
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

//To edit the ad

export async function editAd(req, res) {
  const data = await req.body;

  // Extracting the data from the request
  const { adId, email, newPrice } = data;

  if(!adId || !email || !newPrice) {
    return res.status(400).json({
      message: "AN eror occured while editing the ad",
    });
  }

  try {
    
    await connectDB();

    const theUser = await user.findOne({ $or: [{ email: email }, { username: email }] });

    if (!theUser) {
      return res.status(404).json({
        message: "User not found in Database",
      });
    }

    const theAd = theUser.p2pAd.find((ad) => ad._id.toString() === adId);

    if (!theAd) {
      return res.status(404).json({
        message: "Ad not found",
      });
    }

    theAd.price = newPrice;

    await theUser.save();

    return res.status(200).json({
      message: "Ad edited successfully",
      data: theAd,
    });


  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to edit ad",
    });
  }
}

//To delete the ad
export async function deleteAd(req, res) {
    const data = await req.body;

    const {email, adId} = data;

    if (!email || !adId) {
        return res.status(400).json({
            message: "An error occured while deleting the ad",
        });
    }

    try {

        await connectDB();

        const theUser = await user.findOne({ $or: [{ email: email }, { username: email }] });

        if (!theUser) {
            return res.status(404).json({
                message: "User not found in Database",
            });
        }

        const theAd = theUser.p2pAd.find((ad) => ad._id.toString() === adId);

        if (!theAd) {
            return res.status(404).json({
                message: "Ad not found",
            });
        }

        //Deleting the ad
        theUser.p2pAd = theUser.p2pAd.filter((ad) => ad._id.toString() !== adId);

        //Save the user
        await theUser.save();

        return res.status(200).json({
            message: "Ad deleted successfully",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to delete ad",
        });
    }
}

//To update Ad status

export async function updateStatus(req, res) {
    const data = await req.body;

    const {email, adId} = data;

    if (!email || !adId) {
        return res.status(400).json({
            message: "An error occured while updating the ad status",
        });
    }

    try {

        await connectDB();

        const theUser = await user.findOne({ $or: [{ email: email }, { username: email }] });

        if (!theUser) {
            return res.status(404).json({
                message: "User not found in Database",
            });
        }

        const theAd = theUser.p2pAd.find((ad) => ad._id.toString() === adId);

        if (!theAd) {
            return res.status(404).json({
                message: "Ad not found",
            });
        }

        if (theAd.status === "Online") {
            theAd.status = "Offline";
        } else {
            theAd.status = "Online";
        }

        await theUser.save();

        return res.status(200).json({
            message: "Ad status updated successfully",
            data: theAd,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to update ad status",
        });
    }
}