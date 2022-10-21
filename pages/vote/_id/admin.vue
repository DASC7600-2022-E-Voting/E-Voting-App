<template>
    <div>
        <div v-if="error">{{ error }}</div>
        <div v-if="isLoading">Loading...</div>
        <div v-if="!isAdmin">Please use admin account {{ admin }}</div>
        <div>
            <h2>Set ZK Verification keys</h2>
            <div>Key Progress: {{ keyProgress }}/3</div>
            <v-btn :disabled="!isAdmin || keyProgress === 3 || isLoading" @click="onClickSetKeys">Set verifier key
            </v-btn>
        </div>
        <div>
            <h2>Set tallying result</h2>
            <div v-if="!isTallyingPhase">Is not tallying phase</div>
            <div>
                <v-btn :disabled="!isAdmin || !isTallyingPhase || isLoading" @click="onClickTally">Tally</v-btn>
            </div>
        </div>
        <div>
            <h2>Set tallying result</h2>
            <div v-if="!isRefundPhase">Is not refund phase</div>
            <v-btn :disabled="!isAdmin || !isRefundPhase || isLoading" @click="onClickRefund">Refund</v-btn>
        </div>
        <div>
            <nuxt-link :to="`/vote/${eVotingContractAddress}`">Back to voting page</nuxt-link>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { getVerifierZKSNARKContract, getEVotingContract } from '~/contracts'
import { getVerificationKeys } from '~/helper/verificationKeys';
import { tallying } from '~/helper/administrator';
import { voters } from '~/constant/stub'

export default {
    name: 'VoteAdminPage',
    data() {
        return {
            admin: '',
            error: '',
            isLoading: false,
            keyProgress: 0,
            eVotingContractAddress: this.$route.params.id,
            zkSNARKContractAddress: '',
            keys: [null, null, null],
            currentBlock: 0,
            finishVotingBlock: 0,
            finishTallyBlock: 0,

            nVoters: voters.length,
            registeredVoters: [],
            votedVoters: [],
            votingKeysX: [],
            votingKeysY: [],
            encryptedVotes: [],
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
            return this.keys.map(k => !(k && k[0] && k[0][0] && k[0][0]!== '0'));
        },
        isTallyingPhase() {
            return this.currentBlock >= this.finishVotingBlock && this.currentBlock < this.finishTallyBlock;
        },
        isRefundPhase() {
            return this.currentBlock >= this.finishTallyBlock;
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
                this.getRegisteredAndVotedVoters(),
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
            } else {
                this.keyProgress = keyIndex;
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
        async getRegisteredAndVotedVoters() {
            const nVoters = await this.eVoteInstance.methods.nVoters().call();
            this.nVoters = nVoters;
            for (let i = 0; i < nVoters; i += 1) {
                try {
                    const address = await this.eVoteInstance.methods.voters(i).call();
                    this.registeredVoters.push(address);
                    const publicKeyX = await this.eVoteInstance.methods.publicKeys(address, 0).call();
                    const publicKeyY = await this.eVoteInstance.methods.publicKeys(address, 1).call();
                    this.votingKeysX.push(publicKeyX);
                    this.votingKeysY.push(publicKeyY);
                } catch (err) {
                    break;
                }
            }
            for (let i = 0; i < this.registeredVoters.length; i += 1) {
                const address = this.registeredVoters[i];
                try {
                    const voteX = await this.eVoteInstance.methods.encryptedVotes(address, 0).call();
                    const voteY = await this.eVoteInstance.methods.encryptedVotes(address, 1).call();
                    this.votedVoters.push(address);
                    this.encryptedVotes.push([voteX, voteY]);
                } catch (err) {
                    console.error(err);
                    break;
                }
            }
        },
        async downloadAndSetKey(path, index) {
            if (!this.verifierZKSNARKInstance) return;
            const keyfile = await this.$axios.$get(path)
            const key = getVerificationKeys(keyfile)
            const tx = await this.verifierZKSNARKInstance.methods.setVerifyingKey(key, index).send({ from: this.getAddress });
            return tx;
        },
        async onClickSetKeys() {
            try {
                if (!this.zkSNARKContractAddress) return;
                const promises = [];
                this.isLoading = true;
                if (this.keyProgress <= 0) {
                    promises.push(this.downloadAndSetKey('./zk/verifier_PublicKey.json', 0)
                        .then(() => {
                            this.keyProgress += 1;
                        })
                    );
                }
                if (this.keyProgress <= 1) {
                    promises.push(this.downloadAndSetKey('./zk/verifier_EncrpytedVote.json', 1)
                        .then(() => {
                            this.keyProgress += 1;
                        })
                    );
                }

                if (this.keyProgress <= 2) {
                    promises.push(this.downloadAndSetKey('./zk/verifier_tallying.json', 2)
                        .then(() => {
                            this.keyProgress += 1;
                        })
                    );
                }
                await Promise.all(promises);
            } catch (error) {
                console.error(error);
                this.error = error;
            } finally {
                this.isLoading = false;
            }
        },
        async onClickTally() {
            try {
                this.isLoading = true;
                const { tallyingProof, tallyingResult } = await tallying(this.encryptedVotes)
                const tx = await this.eVoteInstance.methods.setTally(
                    tallyingResult, tallyingProof.a, tallyingProof.b, tallyingProof.c
                ).send({ from: this.getAddress });
                console.log(tx);
            } catch (error) {
                console.error(error);
                this.error = error;
            } finally {
                this.isLoading = false;
            }
        },
        async onClickRefund() {
            try {
                this.isLoading = true;
                const tx = await this.eVoteInstance.methods.refund().send({ from: this.getAddress });
                console.log(tx);
            } catch (error) {
                console.error(error);
                this.error = error;
            } finally {
                this.isLoading = false;
            }
        },
    },
}
</script>