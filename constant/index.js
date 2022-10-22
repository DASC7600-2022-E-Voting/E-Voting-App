export const DEPOSIT_VALUE = '0.001';

export const NETWORKS = [{
    chainId: '0x5',
    chainName: 'Goerli',
    displayName: 'Ethereum (testnet)',
    isTestnet: true,
}, {
    chainId: '0x1',
    chainName: 'Ethereum',
    displayName: 'Ethereum (mainnet)',
}, {
    chainId: '0x13881',
    chainName: 'Mumbai',
    rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
    displayName: 'Polygon (testnet)',
    isTestnet: true,
}, {
    chainId: '0x89',
    chainName: 'Polygon',
    rpcUrls: ['https://matic-mainnet.chainstacklabs.com'],
    displayName: 'Polygon (mainnet)',
}, {
    chainName: 'localhost',
    chainId: '0',
    isDev: true,
    displayName: 'localhost',
}]
