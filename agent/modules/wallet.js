const { ethers } = require("ethers");
const config = require("../config.json");

let provider, wallet;

function init(walletName) {
  provider = new ethers.JsonRpcProvider(config.network.rpc);
  const w = config.wallets[walletName];
  if (!w) throw new Error(`Wallet '${walletName}' not found`);
  wallet = new ethers.Wallet(w.pk, provider);
  return { provider, wallet, address: w.address };
}

async function getTokenContract(signer) {
  return new ethers.Contract(
    config.contracts.NexusAI,
    [
      "function transfer(address,uint256) returns (bool)",
      "function balanceOf(address) view returns (uint256)",
      "function approve(address,uint256) returns (bool)",
      "function allowance(address,address) view returns (uint256)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function totalSupply() view returns (uint256)",
    ],
    signer || provider
  );
}

async function transfer(walletName, toAddress, amountNXI) {
  const { wallet, address } = init(walletName);
  const token = await getTokenContract(wallet);
  const amt = ethers.parseEther(String(amountNXI));
  const bal = await token.balanceOf(address);
  if (bal < amt) throw new Error(`Insufficient balance: ${ethers.formatEther(bal)} < ${amountNXI}`);
  const tx = await token.transfer(toAddress, amt, { gasLimit: 200000 });
  await tx.wait();
  return { tx: tx.hash, from: address, to: toAddress, amount: amountNXI };
}

async function balance(walletName) {
  const { address } = init(walletName);
  const token = await getTokenContract();
  const nxi = await token.balanceOf(address);
  const bnb = await provider.getBalance(address);
  return {
    address,
    label: config.wallets[walletName].label,
    NXI: ethers.formatEther(nxi),
    BNB: ethers.formatEther(bnb),
  };
}

async function approve(walletName, spender, amountNXI) {
  const { wallet, address } = init(walletName);
  const token = await getTokenContract(wallet);
  const amt = ethers.parseEther(String(amountNXI));
  const tx = await token.approve(spender, amt, { gasLimit: 200000 });
  await tx.wait();
  return { tx: tx.hash, owner: address, spender, amount: amountNXI };
}

async function sendBNB(fromWallet, toAddress, amountBNB) {
  const { wallet, address } = init(fromWallet);
  const amt = ethers.parseEther(String(amountBNB));
  const bal = await provider.getBalance(address);
  if (bal < amt) throw new Error(`Insufficient BNB: ${ethers.formatEther(bal)} < ${amountBNB}`);
  const tx = await wallet.sendTransaction({ to: toAddress, value: amt });
  await tx.wait();
  return { tx: tx.hash, from: address, to: toAddress, amount: amountBNB };
}

async function allBalances() {
  const result = {};
  for (const [name, w] of Object.entries(config.wallets)) {
    const b = await balance(name);
    result[name] = b;
  }
  return result;
}

module.exports = { transfer, balance, approve, sendBNB, allBalances, init, getTokenContract };
