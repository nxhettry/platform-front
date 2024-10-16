import Web3 from 'web3';
import QRCode from 'qrcode';

const web3 = new Web3('https://bsc-dataseed.binance.org/');

export const generateWallet = async () => {
  const wallet = web3.eth.accounts.create();
  const qrCodeUrl = await QRCode.toDataURL(wallet.address);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    qrCodeUrl,
  };
};