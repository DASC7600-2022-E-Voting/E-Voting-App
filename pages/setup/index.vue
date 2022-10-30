<template>
    <div>
        <h1>Setting Up New Vote</h1>
        <v-form v-model="inputValid" lazy-validation>
            <h2>Voters List</h2>
            <div>
                <v-textarea 
                    v-model="votersString"
                    solo
                    :rules="[voterListRule]"
                />
            </div>
            <h2>
                Intervals
                <v-tooltip right>
                    <template #activator="{ on }">
                        <v-icon small v-on="on">mdi-information-outline</v-icon>
                    </template>
                    <div>1 Ethereum Block = 12 seconds</div>
                    <div>1 Polygon Block = 5 seconds</div>
                </v-tooltip>
            </h2>
            <div>
                <v-row no-gutters>
                    <v-col cols="3">Registration Block Interval:</v-col>
                    <v-col class="pa-0 pr-4">
                        <v-text-field
                            v-model="registrationBlockInterval"
                            type="number"
                            solo requred
                            :rules="[numberRule]"
                        />
                    </v-col>
                </v-row>
                <v-row no-gutters>
                    <v-col cols="3">Voting Block Interval:</v-col>
                    <v-col class="pa-0 pr-4">
                        <v-text-field
                            v-model="votingBlockInterval" 
                            type="number" 
                            solo required
                            :rules="[numberRule]"
                        />
                    </v-col>
                </v-row>
                <v-row no-gutters>
                    <v-col cols="3">Tally Block Interval:</v-col>
                    <v-col class="pa-0 pr-4">
                        <v-text-field
                            v-model="tallyBlockInterval"
                            type="number"
                            solo required
                            :rules="[numberRule]"
                        />
                    </v-col>
                </v-row>
            </div>
            <div>
                <div v-if="newContractAddress">
                    <h2>New vote created: {{ newContractAddress }}</h2>
                    <div>Go to vote admin page to setup verifier keys</div>
                    <nuxt-link :to="`/vote/${newContractAddress}/admin`">
                        Vote admin page
                    </nuxt-link>
                </div>
                <v-btn
                    v-else :disabled="!getAddress || isLoading || !inputValid" 
                    color="green"
                    @click="deploy"
                >Create</v-btn>
            </div>
        </v-form>

        <div v-if="error">{{ error }}</div>

        <v-overlay :value="isLoading">
            <v-progress-circular
                indeterminate
                size="64"
            ></v-progress-circular>
        </v-overlay>
    </div>

</template>
<script>
import { mapActions, mapGetters } from 'vuex';
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
            inputValid: false
        };
    },
    computed: {
        ...mapGetters('wallet', ['getAddress', 'getWeb3', 'getNetworkId']),
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
        ...mapActions('db', ['postNewVoting']),
        async deploy() {
            try {
                this.isLoading = true;
                const [verifierZKSNARK, verifierMerkleTree] = await Promise.all([
                    newVerifierZKSNARKContract(this.getWeb3()).send({ from: this.getAddress }),
                    newVerifierMerkleTreeContract(this.getWeb3()).send({ from: this.getAddress }),
                ]);
                // eslint-disable-next-line no-console
                console.log(verifierZKSNARK);
                // eslint-disable-next-line no-console
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
                const currentBlock = await this.getWeb3().eth.getBlockNumber();
                try {
                    await this.postNewVoting({
                        contractId: eVoting.options.address,
                        networkId: this.getNetworkId,
                        currentBlock,
                        finishRegistartionBlock: currentBlock + Number(this.registrationBlockInterval),
                        finishVotingBlock: currentBlock + Number(this.registrationBlockInterval) + Number(this.votingBlockInterval),
                        finishTallyBlock: currentBlock + Number(this.registrationBlockInterval) + Number(this.votingBlockInterval) + Number(this.tallyBlockInterval),
                        admin: this.getAddress,
                        voters: this.voters,
                    })
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error(e);
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(err);
                this.error = err;
            } finally {
                this.isLoading = false;
            }
        },
        voterListRule(list){
            if(list.length===0) return 'There must be at least one voter.'
            return true
        },
        numberRule(num){
            const _num = Number(num)
            if (_num <= 0) return 'Block number must be positive.'
            if (_num - Math.floor(_num) !== 0) return 'Please enter an integer'
            return true
        },
    },
}
</script>
