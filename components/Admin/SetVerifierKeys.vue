<template>
    <div>
        <div v-if="error">{{ error }}</div>
        <div>Progress: {{ progress }}/3</div>
        <div v-if="!isAdmin">Please use admin account {{ admin }}</div>
        <v-btn :disabled="!isAdmin" @click="onClickSetKeys">Set verifier key</v-btn>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { admin, contractAddress } from '~/constant/stub'
import { getVerifierZKSNARKContract } from '~/contracts'
import { getVerificationKeys } from '~/helper/verificationKeys';

export default {
    name: 'SetVerifierKeys',
    data() {
        return {
            admin,
            progress: 0,
            error: '',
        };
    },
    computed: {
        ...mapGetters('wallet', ['getAddress', 'getWeb3']),
        isAdmin() {
            return this.getAddress && this.getAddress.toLowerCase() === admin.toLowerCase();
        },
    },
    methods: {
        async onClickSetKeys() {
            try {
                const verifierZKSNARKInstance = getVerifierZKSNARKContract(this.getWeb3(), contractAddress.verifierZKSNARK);
                const vPubKey = await this.$axios.$get('./zk/verifier_PublicKey.json')
                const verifierPublicKeyVkey = getVerificationKeys(vPubKey)
                let tx = await verifierZKSNARKInstance.methods.setVerifyingKey(verifierPublicKeyVkey, 0).send({ from: this.getAddress });
                console.log(tx);
                this.progress += 1;

                const vEncrpytedVote = await this.$axios.$get('./zk/verifier_EncrpytedVote.json')
                const verifierEncrpytedVoteVkey = getVerificationKeys(vEncrpytedVote)
                tx = await verifierZKSNARKInstance.methods.setVerifyingKey(verifierEncrpytedVoteVkey, 1).send({ from: this.getAddress });
                this.progress += 1;

                const vTallying = await this.$axios.$get('./zk/verifier_tallying.json')
                const verifierTallyingVkey = getVerificationKeys(vTallying)
                tx = await verifierZKSNARKInstance.methods.setVerifyingKey(verifierTallyingVkey, 2).send({ from: this.getAddress });
                this.progress += 1;
            } catch (error) {
                console.error(error);
                this.error = error;
            }
        },
    }
}
</script>
