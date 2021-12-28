const ethers = require("ethers");
const dotenv = require("dotenv");
const { Watcher } = require("@nahmii/core-utils");
const { predeploys, getContractInterface } = require("@nahmii/contracts");
const relayer = require("@nahmii/message-relayer");

const { networks } = require("./networks");
const {
  printWelcome,
  printAccountDetails,
  printBalanceWarning,
  printWithdrawDetails,
  printResult,
  getUserPrompt,
  printError,
} = require("./log");
const { validateInput, validateFunds } = require("./utils");

dotenv.config();

const USER_PK = process.env.USER_PRIVATE_KEY;
const USER_TX_HASH = process.env.USER_TX_HASH;
const NETWORK = process.env.NETWORK;

const VERSION = "1.0";

const main = async () => {
  printWelcome(VERSION);

  const inputErrors = validateInput([USER_PK, USER_TX_HASH, NETWORK]);

  if (inputErrors.length > 0) return printError(inputErrors);

  // Set up our RPC provider connections.
  const l1RpcProvider = new ethers.providers.JsonRpcProvider(
    networks[NETWORK].l1
  );
  const l2RpcProvider = new ethers.providers.JsonRpcProvider(
    networks[NETWORK].l2
  );

  const l1Wallet = new ethers.Wallet(USER_PK, l1RpcProvider);

  const userAddress = await l1Wallet.getAddress();
  const userBalance = await l1Wallet.getBalance();

  const validBalance = await validateFunds(userBalance, l1Wallet);

  await printAccountDetails(userAddress, userBalance, validBalance);

  if (!validBalance) printBalanceWarning();
  
  const l1AddressManager = new ethers.Contract(
    networks[NETWORK].addressManager,
    getContractInterface("Lib_AddressManager"),
    l1RpcProvider
  );
  const l2AddressManager = new ethers.Contract(
    predeploys.Lib_AddressManager,
    getContractInterface("Lib_AddressManager"),
    l2RpcProvider
  );

  const l1Messenger = new ethers.Contract(
    await l2AddressManager.getAddress("NVM_L1CrossDomainMessenger"),
    getContractInterface("NVM_L1CrossDomainMessenger"),
    l1RpcProvider
  );

  const l1MessengerAddress = l1Messenger.address;
  const l2MessengerAddress = networks.l2Messenger;

  // Tool that helps watches and waits for messages to be relayed between L1 and L2.
  const watcher = new Watcher({
    l1: {
      provider: l1RpcProvider,
      messengerAddress: l1MessengerAddress,
    },
    l2: {
      provider: l2RpcProvider,
      messengerAddress: l2MessengerAddress,
    },
  });

  const withdrawData = await relayer.getWithdrawalsByTxHashes(
    [USER_TX_HASH],
    watcher,
    l1AddressManager
  );

  if (withdrawData.length == 0)
    return printError(["Invalid hash provided, no withdraw record found."]);

  const validWithdraw = await printWithdrawDetails(withdrawData[0], l1Wallet);
  if (!validWithdraw) return printError(["Provided hash is not claimable"]);

  const continueWithdraw = getUserPrompt();

  if (!continueWithdraw) return printError(["User exited process."]);

  try {
    const [msgHash2] = await watcher.getMessageHashesFromL2Tx(USER_TX_HASH);
    await relayer.relayXDomainMessages(
      USER_TX_HASH,
      l1Messenger.address,
      l1RpcProvider,
      l2RpcProvider,
      l1Wallet
    );
    const receipt = await watcher.getL1TransactionReceipt(msgHash2);
    printResult(receipt, NETWORK);
  } catch (e) {
    return printError([
      `${e.reason}. Common failures here indicate insufficient ETH in connected account.`,
    ]);
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
