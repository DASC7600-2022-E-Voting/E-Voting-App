<template>
    <div>
        <div v-if="error">{{ error }}</div>
        <div v-if="isLoading">Loading...</div>
        <div>
            <div>
                <label>Voter list:</label>
                <v-textarea v-model="votersString" />
            </div>
            <div>
                <div>
                    <label>registration Block Interval:</label>
                    <v-text-field v-model="registrationBlockInterval" type="number" />
                </div>
                <div>
                    <label>voting Block Interval:</label>
                    <v-text-field v-model="votingBlockInterval" type="number" />
                </div>
                <div>
                    <label>tally Block Interval:</label>
                    <v-text-field v-model="tallyBlockInterval" type="number" />
                </div>
            </div>
            <div>
                <div v-if="newContractAddress">
                    <h2>New vote created: {{ newContractAddress }}</h2>
                    <div>Go to vote admin page to setup verifier keys</div>
                    <nuxt-link :to="`/vote/${newContractAddress}/admin`">
                        Vote admin page
                    </nuxt-link>
                </div>
                <v-btn v-else :disabled="!getAddress || Loading" @click="deploy">Create</v-btn>
            </div>
        </div>
    </div>
</template>
<script>
import { mapGetters } from 'vuex';
import web3 from 'web3';
import {
    newEVotingContract,
    newVerifierMerkleTreeContract,
    newVerifierZKSNARKContract,
} from '~/contracts';
import { MerkleTree } from '~/helper/merkletree';
import { voters } from '~/constant/stub';
import { DEPOSIT_VALUE } from '~/constant';

export default {
    name: 'SetupPage',
    data() {
        return {
            error: '',
            isLoading: false,
            votersString: voters.join('\n'),
            voters,
            registrationBlockInterval: 300,
            votingBlockInterval: 300,
            tallyBlockInterval: 300,
            newContractAddress: '',
        };
    },
    computed: {
        ...mapGetters('wallet', ['getAddress', 'getWeb3']),
        usersMerkleTree() {
            return new MerkleTree(this.voters);
        },
    },
    watch: {
        votersString(s) {
            if (s) {
                this.voters = s.split('\n')
            }
        },
    },
    methods: {
        async deploy() {
            try {
                const [verifierZKSNARK, verifierMerkleTree] = await Promise.all([
                    newVerifierZKSNARKContract(this.getWeb3()).send({ from: this.getAddress }),
                    newVerifierMerkleTreeContract(this.getWeb3()).send({ from: this.getAddress }),
                ]);
                this.isLoading = true;
                console.log(verifierZKSNARK);
                console.log(verifierMerkleTree);
                const verifierZKSNARKAddress = verifierZKSNARK.options.address;
                const verifierMerkleTreeAddress = verifierMerkleTree.options.address;
                const eVoting = await newEVotingContract(this.getWeb3(), [
                    verifierMerkleTreeAddress,
                    verifierZKSNARKAddress,
                    this.usersMerkleTree.getHexRoot(),
                    this.registrationBlockInterval,
                    this.votingBlockInterval,
                    this.tallyBlockInterval,
                ]).send({ from: this.getAddress, value: web3.utils.toWei(DEPOSIT_VALUE, "ether") });
                this.newContractAddress = eVoting.options.address;
            } catch (err) {
                console.error(err);
                this.error = err;
            } finally {
                this.isLoading = false;
            }
        },
    },
}
</script>
