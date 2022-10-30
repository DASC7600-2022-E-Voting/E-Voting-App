import { initializeApp } from 'firebase/app';
import { getDatabase, get, ref, set, query, orderByChild, equalTo } from "firebase/database";

const state = () => ({
    inited: false,
    votings: null,
})

const mutationTypes = {
    'SET_DB_INITED': 'SET_DB_INITED',
    'SET_VOTING_LIST': 'SET_VOTING_LIST',
    'ADD_TO_VOTING_LIST': 'ADD_TO_VOTING_LIST',
}

const mutations = {
    [mutationTypes.SET_DB_INITED](state) {
        state.inited = true;
    },
    [mutationTypes.SET_VOTING_LIST](state, votings) {
        state.votings = votings;
    },
    [mutationTypes.ADD_TO_VOTING_LIST](state, voting) {
        state.votings.push(voting);
    },
};


const actions = {
    initDatabse({ commit }) {
        const firebaseConfig = {
            apiKey: "AIzaSyANmT8Ad1i-vKanMEVQY-gXv0NEoHAUf2E",
            authDomain: "dasc7600-2022-e-voting.firebaseapp.com",
            databaseURL: "https://dasc7600-2022-e-voting-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "dasc7600-2022-e-voting",
            storageBucket: "dasc7600-2022-e-voting.appspot.com",
            messagingSenderId: "125321271640",
            appId: "1:125321271640:web:ad50d02ea9895db940ad2d",
            measurementId: "G-632896FHS6"
        };
        initializeApp(firebaseConfig);
        commit(mutationTypes.SET_DB_INITED);
    },
    async fetchVotingList({ dispatch, commit, state }, { networkId }) {
        if (!state.inited) await dispatch('initDatabse');
        const snapshot = await get(query(ref(getDatabase(), `votings`), orderByChild('networkId'), equalTo(networkId)))
        const list = Object.values(snapshot.val() || {});
        commit(mutationTypes.SET_VOTING_LIST, list);
        return list;
    },
    async postNewVoting({ dispatch, commit }, payload) {
        if (!state.inited) await dispatch('initDatabse');
        const {
            contractId,
            networkId,
            currentBlock,
            finishRegistartionBlock,
            finishVotingBlock,
            finishTallyBlock,
            admin,
            voters,
        } = payload
        const db = getDatabase();
        await set(ref(db, 'votings/' + contractId), {
            contractId,
            networkId,
            currentBlock,
            finishRegistartionBlock,
            finishVotingBlock,
            finishTallyBlock,
            admin,
            voters,
        });
        commit(mutationTypes.ADD_TO_VOTING_LIST, payload);
    },
}

const getters = {
    getVotings(state) {
        if (state.votings){
            // newest first
            return [...state.votings].sort((a, b) => b.currentBlock - a.currentBlock)
        }
        return null
    },
    getVotingById(state) {
        return (id) => (state.votings || []).find(v => v.contractId.toLowerCase() === id.toLowerCase());
    },
}

export default {
    state,
    mutations,
    actions,
    getters,
};