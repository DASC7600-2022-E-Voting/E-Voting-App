<template>
    <div>
        <div v-if="error">{{ error }}</div>
        <div v-if="!isAdmin">Please use admin account {{ admin }}</div>
        <div>
            <v-btn :disabled="!isAdmin" @click="onClickTally">Tally</v-btn>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { admin } from '~/constant/stub';
import { getEVotingContract } from '~/contracts'

export default {
    name: 'VoteAdminPage',
    data() {
        return {
            admin,
            error: '',
            contractAddress: this.$route.params.id,
        }
    },
    computed: {
        ...mapGetters('wallet', ['getAddress', 'getWeb3']),
        isAdmin() {
            return this.getAddress && this.getAddress.toLowerCase() === admin.toLowerCase();
        },
        eVoteInstance() {
            return this.getAddress ? getEVotingContract(this.getWeb3(), this.contractAddress) : null;
        },
    },
    methods: {
        async onClickTally() {
            try {
                const tallyData = { voteOption: this.voteOption }; // TODO: generate zk proof
                const {
                    tallyingResult = [1, 2],
                    tallyingProof = { a: [1, 2], b: [[3, 4], [5, 6]], c: [5, 6] },
                } = tallyData;
                const tx = await this.eVoteInstance.methods.setTally(
                    tallyingResult, tallyingProof.a, tallyingProof.b, tallyingProof.c
                ).send({ from: this.getAddress });
                console.log(tx);
            } catch (error) {
                console.error(error);
                this.error = error;
            }
        },
    },
}
</script>