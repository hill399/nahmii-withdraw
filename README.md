# L2 -> L1 Bridge Withdraw

This example shows how use the nahmii Node.js tools to withdraw funds from the bridge contract. **THIS IS FOR EDUCATIONAL PURPOSES ONLY AND AUTHOR IS NOT LIABLE FOR LOSS OF FUNDS.**

This code is a stripped back version of the code provided within [nahmii-example-scripts](https://github.com/nahmii-community/nahmii-examples-scripts).

This example expects the user to have already started the challenge period via the current bridge GUI and the challenge period has been completed (7 days from withdraw).

Approximate gas used:

ETH Withdraw: ~450k

ERC20 Withdraw: ~550k

## How to run this project

The first step involves installing the dependencies via yarn.

```sh
yarn
```

Fill in the user-specific details in the `user.env` file:

`USER_PRIVATE_KEY` : Private key of funded L1 account. **NOTE:** Does not need to be the same account which initiated the withdraw (i.e. can use an account to proxy call).

`USER_TX_HASH` : Transaction hash in which the withdraw function was triggered.

`NETWORK` : Use `mainnet` or `testnet` dependant on network you wish to use.

Rename file to `.env` (note: file may seem to disappear from folder, this is normal).

Run the code using the below, once finished it will close and funds should be withdrawn!

```sh
yarn run start
```
