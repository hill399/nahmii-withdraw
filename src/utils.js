
const ethers = require("ethers");
const erc20Abi = require('../abi/ERC20ABI.json');

const EST_GAS = 550000;

exports.validateInput = (input) => {
  const errors = [];

  if (!input[0] || input[0] && input[0].length !== 64) errors.push("Invalid private key provided");
  if (!input[1] || input[1].length !== 66) errors.push("Invalid TX Hash provided");
  if (!input[2] || !(input[2] !== "mainnet" || input[2] !== "testnet"))
    errors.push("Invalid network provided");

  if (errors.length === 3) errors.push("No user variables found. Check .env setup.");

  return errors;
};

exports.getTokenData = async (address, provider) => {
  const contract = new ethers.Contract(address, erc20Abi, provider);
  const name = await contract.name();
  const symbol = await contract.symbol();
  const decimals = await contract.decimals();

  return { name, symbol, decimals };
};


exports.validateFunds = async (balance, provider) => {
    const gas = await provider.getGasPrice();
    const estGas = gas.mul(EST_GAS);

    return estGas.lt(balance);
}