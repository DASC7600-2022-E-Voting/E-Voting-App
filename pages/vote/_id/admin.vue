<template>
    <div>
        <div v-if="error">{{ error }}</div>
        <div v-if="!isAdmin">Please use admin account {{ admin }}</div>
        <h2>Set ZK Verification keys</h2>
        <div>
            <div>Key Progress: {{ keyProgress }}/3</div>
            <v-btn :disabled="!isAdmin || keyProgress === 3" @click="onClickSetKeys">Set verifier key</v-btn>
        </div>
        <h2>Set tallying result</h2>
        <div v-if="!isTallyingPhase">Is not tallying phase</div>
        <div>
            <v-btn :disabled="!isAdmin || !isTallyingPhase" @click="onClickTally">Tally</v-btn>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { getVerifierZKSNARKContract, getEVotingContract } from '~/contracts'
import { getVerificationKeys } from '~/helper/verificationKeys';

export default {
    name: 'VoteAdminPage',
    data() {
        return {
            admin: '',
            error: '',
            keyProgress: 0,
            eVotingContractAddress: this.$route.params.id,
            zkSNARKContractAddress: '',
            keys: [null, null, null],
            currentBlock: 0,
            finishVotingBlock: 0,
            finishTallyBlock: 0,
        }
    },
    computed: {
        ...mapGetters('wallet', ['getAddress', 'getWeb3']),
        isAdmin() {
            return this.admin && this.getAddress && this.getAddress.toLowerCase() === this.admin.toLowerCase();
        },
        eVoteInstance() {
            return this.getAddress ? getEVotingContract(this.getWeb3(), this.eVotingContractAddress) : null;
        },
        verifierZKSNARKInstance() {
            return this.getAddress ? getVerifierZKSNARKContract(this.getWeb3(), this.zkSNARKContractAddress) : null;
        },
        keysIsEmpty() {
            return this.keys.map(k => !(k && k[0] && k[0][0] !== '0'));
        },
        isTallyingPhase() {
            return this.currentBlock >= this.finishVotingBlock && this.currentBlock < this.finishTallyBlock;
        },
    },
    watch: {
        getAddress(address) {
            if (address) {
                this.init();
            }
        },
    },
    mounted() {
        if (this.getAddress) {
            this.init()
        }
    },
    methods: {
        async init() {
            await Promise.all([
                this.getAdmin(),
                this.getVerifierContract(),
                this.updateVotingPhases(),
            ]);
            await this.getVerifierKeys();
        },
        async getAdmin() {
            const address = await this.eVoteInstance.methods.admin().call();
            if (address) this.admin = address;
        },
        async getVerifierContract() {
            const vzkSNARK = await this.getWeb3().eth.getStorageAt(this.eVotingContractAddress, 1);
            const address = await this.getWeb3().eth.abi.decodeParameters(['address'], vzkSNARK);
            if (address && address[0]) this.zkSNARKContractAddress = address[0];
        },
        async getVerifierKeys() {
            this.keys = await Promise.all(this.keys.map((k, index) => this.verifierZKSNARKInstance.methods.vk(index).call()));
            const keyIndex = this.keysIsEmpty.findIndex(k => k);
            if (keyIndex === -1) {
                this.keyProgress = 3;
            }
        },
        async updateVotingPhases() {
            const [currentBlock, finishVotingBlock, finishTallyBlock] = await Promise.all([
                this.getWeb3().eth.getBlockNumber(),
                this.eVoteInstance.methods.finishVotingBlockNumber().call(),
                this.eVoteInstance.methods.finishTallyBlockNumber().call(),
            ]);
            this.currentBlock = currentBlock;
            this.finishVotingBlock = Number(finishVotingBlock);
            this.finishTallyBlock = Number(finishTallyBlock);
        },
        async onClickSetKeys() {
            try {
                if (!this.zkSNARKContractAddress) return;
                const verifierZKSNARKInstance = this.verifierZKSNARKInstance;
                if (this.keyProgress === 0) {
                    const vPubKey = await this.$axios.$get('./zk/verifier_PublicKey.json')
                    const verifierPublicKeyVkey = getVerificationKeys(vPubKey)
                    const tx = await verifierZKSNARKInstance.methods.setVerifyingKey(verifierPublicKeyVkey, 0).send({ from: this.getAddress });
                    console.log(tx);
                    this.keyProgress += 1;
                }

                if (this.keyProgress === 1) {
                    const vEncrpytedVote = await this.$axios.$get('./zk/verifier_EncrpytedVote.json')
                    const verifierEncrpytedVoteVkey = getVerificationKeys(vEncrpytedVote)
                    const tx = await verifierZKSNARKInstance.methods.setVerifyingKey(verifierEncrpytedVoteVkey, 1).send({ from: this.getAddress });
                    console.log(tx);
                    this.keyProgress += 1;
                }

                if (this.keyProgress === 2) {
                    const vTallying = await this.$axios.$get('./zk/verifier_tallying.json')
                    const verifierTallyingVkey = getVerificationKeys(vTallying)
                    const tx = await verifierZKSNARKInstance.methods.setVerifyingKey(verifierTallyingVkey, 2).send({ from: this.getAddress });
                    console.log(tx);
                    this.keyProgress += 1;
                }
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