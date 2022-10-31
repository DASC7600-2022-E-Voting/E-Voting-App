/* eslint-disable no-unused-vars */
import Web3 from "web3";
import { NETWORKS } from "~/constant";

const state = () => ({
    web3: null,
    address: '',
    networkId: NETWORKS[0].chainId,
})

const mutationTypes = {
    'SET_WEB3': 'SET_WEB3',
    'SET_ADDRESS': 'SET_ADDRESS',
    'SET_NETWORK_ID': 'SET_NETWORK_ID',
}

const mutations = {
    [mutationTypes.SET_WEB3](state, web3) {
        state.web3 = web3;
    },
    [mutationTypes.SET_ADDRESS](state, address) {
        state.address = address;
    },
    [mutationTypes.SET_NETWORK_ID](state, networkId) {
        state.networkId = networkId;
    },
};


const actions = {
    async initWallet({ commit, dispatch, state }) {
        if (window.ethereum) {
            const res = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const web3 = new Web3(window.ethereum);
            commit(mutationTypes.SET_WEB3, () => web3);
            window.ethereum.on('accountsChanged', function (accounts) {
                commit(mutationTypes.SET_ADDRESS, accounts[0]);
            })
            commit(mutationTypes.SET_ADDRESS, res[0]);
            await dispatch('switchNetwork', state.networkId);
            return true;
        }
        return false;
    },
    async switchNetwork({ commit, dispatch }, targetId) {
        const network = NETWORKS.find(n => n.chainId === targetId);
        if (!network) throw new Error('NETWORK_NOT_FOUND');
        const {
            chainId,
            chainName,
            rpcUrls,
        } = network;
        if (window.ethereum) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId,
                                chainName,
                                rpcUrls,
                            },
                        ],
                    });
                }
                throw switchError;
            }
        }
        commit(mutationTypes.SET_NETWORK_ID, targetId);
        try {
            dispatch('db/fetchVotingList', { networkId: targetId }, { root: true });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    }
}

const getters = {
    getWeb3(state) {
        return state.web3
    },
    getAddress(state) {
        return state.address
    },
    getNetworkId(state) {
        return state.networkId
    },
    getBlockTime(state) {
        return NETWORKS.find(n => n.chainId === state.networkId).blockTime
    }
}

export default {
    state,
    mutations,
    actions,
    getters,
};