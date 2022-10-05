<template>
    <div>
        <div v-if="error">{{ error }}</div>
        <div v-if="!isAdmin">Please use admin account {{ admin }}</div>
        <div>
            <div>Key Progress: {{ keyProgress }}/3</div>
            <v-btn :disabled="!isAdmin" @click="onClickSetKeys">Set verifier key</v-btn>
        </div>
        <div>
            <v-btn :disabled="!isAdmin" @click="onClickTally">Tally</v-btn>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { getVerifierZKSNARKContract, getEVotingContract } from '~/contracts'
import { admin, contractAddress } from '~/constant/stub'
import { getVerificationKeys } from '~/helper/verificationKeys';

export default {
    name: 'VoteAdminPage',
    data() {
        return {
            admin,
            error: '',
            keyProgress: 0,
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
        async onClickSetKeys() {
            try {
                // TODO: should not hardcode zksnark contract address
                const verifierZKSNARKInstance = getVerifierZKSNARKContract(this.getWeb3(), contractAddress.verifierZKSNARK);
                const vPubKey = await this.$axios.$get('./zk/verifier_PublicKey.json')
                const verifierPublicKeyVkey = getVerificationKeys(vPubKey)
                let tx = await verifierZKSNARKInstance.methods.setVerifyingKey(verifierPublicKeyVkey, 0).send({ from: this.getAddress });
                console.log(tx);
                this.keyProgress += 1;

                const vEncrpytedVote = await this.$axios.$get('./zk/verifier_EncrpytedVote.json')
                const verifierEncrpytedVoteVkey = getVerificationKeys(vEncrpytedVote)
                tx = await verifierZKSNARKInstance.methods.setVerifyingKey(verifierEncrpytedVoteVkey, 1).send({ from: this.getAddress });
                this.keyProgress += 1;

                const vTallying = await this.$axios.$get('./zk/verifier_tallying.json')
                const verifierTallyingVkey = getVerificationKeys(vTallying)
                tx = await verifierZKSNARKInstance.methods.setVerifyingKey(verifierTallyingVkey, 2).send({ from: this.getAddress });
                this.keyProgress += 1;
            } catch (error) {
                console.error(error);
                this.error = error;
            }
        },
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