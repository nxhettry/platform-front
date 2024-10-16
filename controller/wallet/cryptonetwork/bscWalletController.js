import user from "../../../model/user.js";
import connectDB from "../../../utils/connectDB.js";
import {generateWallet} from "../../../utils/generateWallet.js";

// Creating BSC Wallet
export async function createBscWallet(req, res) {
  const { email } = await req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  try {
    await connectDB();

    //Getting user's data
    const userExist = await user.findOne({ email });

    if (!userExist) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    const { address, privateKey, qrCodeUrl } = userExist;

    if (address && privateKey && qrCodeUrl) {
      const res = {
        address,
        qrCodeUrl,
      };
      return res.status(409).json({
        message: "User already has a wallet and all the credentials",
        data: res,
      });
    } else {
      //Generate a new address
      const generatedAddress = await generateWallet();
      const { address, privateKey, qrCodeUrl } = generatedAddress;

      //Setting new address for a new user
      userExist.address = address;
      userExist.privateKey = privateKey;
      userExist.qrCodeUrl = qrCodeUrl;

      //Saving the data
      const result = await userExist.save();

      if (!result) {
        return res.status(500).json({
          message: "An error occurred while saving the wallet in try",
        });
      }

      const filteredRes = {
        address: result.address,
        qrCodeUrl: result.qrCodeUrl,
      };

      return res.status(200).json({
        message: "Wallet saved successfully",
        data: filteredRes,
      });
    }

  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while saving the wallet",
    });
  }
}

// Getting the bsc wallet address
export async function getBscWallet(req, res) {
  const { email } = await req.body;

  try {
    await connectDB();
    const userData = await user.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const { address, qrCodeUrl } = userData;

    return res.status(200).json({ data: { address, qrCodeUrl }, message: "Success" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

