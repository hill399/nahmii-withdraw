const chalk = require("chalk");
const ethers = require("ethers");
const readline = require('readline-sync');

const { getTokenData } = require('./utils');

const log = console.log;

exports.printWelcome = (version) => {
  log(chalk.bold(`\n------ nahmii withdraw v${version} -----\n`));
};

exports.printAccountDetails = async (address, balance, valid) => {
  const formattedBalance = ethers.utils.formatEther(balance);

  const logBalance = !valid ? chalk.yellow(`${formattedBalance} ETH\n`) : `${formattedBalance} ETH\n`; 

  log(`${chalk.bold('Connected Account:')} ${address}`);
  log(`${chalk.bold('Account Balance:')}   ${logBalance}`);
};

exports.printWithdrawDetails = async (data, wallet) => {
    let name, decimals;

    const nowTs = Math.floor(Date.now() / 1000);
    const claimFormat = nowTs > data.settlementPeriod.end ? chalk.green : chalk.red;
    const finalisedFormat = data.finalized ? chalk.red : chalk.green;

    if (!data.erc20) {
        name = 'Ether (ETH)';
        decimals = 18;
    } else {
        const tokenData = await getTokenData(data.erc20.l1, wallet);
        name = `${tokenData.name} (${tokenData.symbol})`;
        decimals = tokenData.decimals;
    }

    log(chalk.bold('--- Withdraw Details ---\n'));
    log(`${chalk.bold('TX Hash:')} ${data.l2TxHash}`);
    log(`${chalk.bold('Name:')} ${name}`);
    log(`${chalk.bold('Amount:')} ${ethers.utils.formatUnits(data.amount, decimals)}`);
    log(`${chalk.bold('Initiated:')} ${new Date(data.settlementPeriod.start * 1000)}`);
    log(`${chalk.bold('Claimable:')} ${claimFormat(new Date(data.settlementPeriod.end * 1000))}`);
    log(`${chalk.bold('Finalised:')} ${finalisedFormat(data.finalized)}\n`);

    return (nowTs > data.settlementPeriod.end && !data.finalized);
};

exports.printError = (messages) => {
    for (const message of messages) {
        log(chalk.red(`ERROR: ${message}`));
    }
}

exports.getUserPrompt = () => {
    const resp = readline.question(chalk.yellow.bold('Continue? [y/n]'));
    return resp.toLowerCase() == 'y';
}

exports.printResult = (receipt, network) => {
    const linkPrefix = network == 'testnet' ? 'https://ropsten.etherscan.io/tx/' : 'https://etherscan.io/tx/';

    log(chalk.green.bold('\nTransaction Success!'));
    log(chalk.green.bold(`View at ${linkPrefix + receipt.transactionHash}`));
}

exports.printBalanceWarning = () => {
    log(chalk.yellow('(Wallet ETH Balance may be too low)\n'));
}