export const DEPOSIT_VALUE = '0.001';

export const NETWORKS = [{
    chainId: '0x5',
    chainName: 'Goerli',
    displayName: 'Ethereum (testnet)',
    blockTime: 12,
    isTestnet: true,
}, {
    chainId: '0x1',
    chainName: 'Ethereum',
    displayName: 'Ethereum (mainnet)',
    blockTime: 12,
}, {
    chainId: '0x13881',
    chainName: 'Mumbai',
    rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
    displayName: 'Polygon (testnet)',
    blockTime: 5,
    isTestnet: true,
}, {
    chainId: '0x89',
    chainName: 'Polygon',
    rpcUrls: ['https://matic-mainnet.chainstacklabs.com'],
    displayName: 'Polygon (mainnet)',
    blockTime: 2,
}, {
    chainName: 'localhost',
    chainId: '0',
    blockTime: 1,
    isDev: true,
    displayName: 'localhost',
}]
