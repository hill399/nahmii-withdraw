const ethers = require('ethers')
const dotenv = require('dotenv');
const { Watcher } = require('@nahmii/core-utils')
const { predeploys, getContractInterface } = require('@nahmii/contracts')
const relayer = require('@nahmii/message-relayer')

const { networks } = require('../utils/networks');

dotenv.config();

// USER SET PRIVATE KEY AND WITHDRAW HASH HERE
const USER_PK = process.env.USER_PRIVATE_KEY;
const USER_TX_HASH = process.env.USER_TX_HASH;
const NETWORK = process.env.NETWORK;

async function main() {
  // Set up our RPC provider connections.
  const l1RpcProvider = new ethers.providers.JsonRpcProvider(networks[NETWORK].l1);
  const l2RpcProvider = new ethers.providers.JsonRpcProvider(networks[NETWORK].l2);

  const l1Wallet = new ethers.Wallet(USER_PK, l1RpcProvider)

  const l1AddressManager = new ethers.Contract(
    networks[NETWORK].addressManager,
    getContractInterface('Lib_AddressManager'),
    l1RpcProvider
  )
  const l2AddressManager = new ethers.Contract(
    predeploys.Lib_AddressManager,
    getContractInterface('Lib_AddressManager'),
    l2RpcProvider
  )

  const l1Messenger = new ethers.Contract(
    await l2AddressManager.getAddress('NVM_L1CrossDomainMessenger'),
    getContractInterface('NVM_L1CrossDomainMessenger'),
    l1RpcProvider
  )

  const l1MessengerAddress = l1Messenger.address
  // L2 messenger address is always the same.
  const l2MessengerAddress = '0x4200000000000000000000000000000000000007'

  // Tool that helps watches and waits for messages to be relayed between L1 and L2.
  const watcher = new Watcher({
    l1: {
      provider: l1RpcProvider,
      messengerAddress: l1MessengerAddress
    },
    l2: {
      provider: l2RpcProvider,
      messengerAddress: l2MessengerAddress
    }
  })

  console.log('Getting the withdrawal info based on the hashes')
  console.log(await relayer.getWithdrawalsByTxHashes([USER_TX_HASH], watcher, l1AddressManager))

  console.log(`Waiting for withdrawal to be relayed to L1...`)
  const [ msgHash2 ] = await watcher.getMessageHashesFromL2Tx(USER_TX_HASH)

  await relayer.relayXDomainMessages(USER_TX_HASH, l1Messenger.address, l1RpcProvider, l2RpcProvider, l1Wallet)

  // Wait for the message to be relayed to L1.
  await watcher.getL1TransactionReceipt(msgHash2)

  console.log('Done!');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
