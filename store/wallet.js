/* eslint-disable no-unused-vars */
import Web3 from "web3";

const state = () => ({
    web3: null,
    address: '',
})

const mutationTypes = {
    'SET_WEB3': 'SET_WEB3',
    'SET_ADDRESS': 'SET_ADDRESS',
}

const mutations = {
    [mutationTypes.SET_WEB3](state, web3) {
        state.web3 = web3;
    },
    [mutationTypes.SET_ADDRESS](state, address) {
        state.address = address;
    },
};


const actions = {
    async initWallet({ commit, dispatch }) {
        if (window.ethereum) {
            const res = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const web3 = new Web3(window.ethereum);
            await dispatch('switchNetwork');
            commit(mutationTypes.SET_WEB3, () => web3);
            commit(mutationTypes.SET_ADDRESS, res[0]);
            return true;
        }
        return false;
    },
    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x13881' }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: '0x13881',
                            chainName: 'Mumbai',
                            rpcUrls: ['https://matic-mumbai.chainstacklabs.com'] /* ... */,
                        },
                    ],
                });
            }
            throw switchError;
        }
    }
}

const getters = {
    getWeb3(state) {
        return state.web3
    },
    getAddress(state) {
        return state.address
    }
}

export default {
    state,
    mutations,
    actions,
    getters,
};