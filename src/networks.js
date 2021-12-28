const networks = {
    mainnet: {
        l1: 'https://mainnet.infura.io/v3/70ded10ed2504d8f8b2031e096427fa7',
        l2: 'https://l2.nahmii.io/',
        addressManager: '0x7934915C03eA2E2C4D69c269F45598B738ddee08'
    },
    testnet: {
        l1: 'https://ropsten.infura.io/v3/70ded10ed2504d8f8b2031e096427fa7',
        l2: 'https://l2.testnet.nahmii.io/',
        addressManager: '0x357eCd03C1601273094Db3474A13D2452cF6785A'
    },
    l2Messenger: '0x4200000000000000000000000000000000000007'
}

module.exports = {
    networks
}