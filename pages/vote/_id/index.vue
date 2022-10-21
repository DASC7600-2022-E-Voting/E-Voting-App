<template>
  <div>
    <div v-if="error">{{ error }}</div>
    <div v-if="isLoading">Loading...</div>
    <div>
      <h2>Voting Status</h2>
      <div>Voters Expected: {{ nVoters }}</div>
      <div>Voters Registered: {{ registeredVoters.length }}</div>
      <div>Voters Voted: {{ votedVoters.length }}</div>
      <div>Tally Result: {{ voteResultDisplay }}</div>
    </div>
    <div v-if="!getAddress">
      <h2>Voting actions</h2>
      Please connect your wallet first
    </div>
    <div v-else>
      <h2>Voting actions</h2>
      <div v-if="!isVoter">You are not voter!</div>
      <hr />
      <div>
        <div>Registration end time: {{ registrationEndTime }}</div>
        <div v-if="isRegisterPhase">Please Register as voter</div>
        <div v-else>Is not register phase</div>
        <v-btn :disabled="!isVoter || !isRegisterPhase || isLoading" @click="onClickRegister">Register</v-btn>
      </div>
      <hr />
      <div>
        <div>voting end time: {{ votingEndTime }}</div>
        <div v-if="isVotingPhase">Please Vote</div>
        <div v-else>Is not voting phase</div>
        <label>Vote option:</label>
        <v-text-field v-model="voteOption" type="number" :disabled="!isVoter" />
        <v-btn :disabled="!isVoter || !isVotingPhase || isLoading" @click="onClickVote">Vote</v-btn>
      </div>
      <hr />
      <div>
        <div>refund start time: {{ tallyEndTime }}</div>
        <div v-if="isRefundPhase">Please refund here</div>
        <div v-else>Is not refund phase</div>
        <v-btn :disabled="!isVoter || !isRefundPhase || isLoading" @click="onClickRefund">Refund</v-btn>
      </div>
    </div>
    <div>
      <h2>Admin page</h2>
      <nuxt-link :to="`/vote/${contractAddress}/admin`">Go to admin link</nuxt-link>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import web3 from 'web3';
import { MerkleTree } from '~/helper/merkletree';
import { genPublicKeysAndProof, genEncryptedVotesAndProofs } from '~/helper/voters';
import { voters } from '~/constant/stub'
import { DEPOSIT_VALUE } from '~/constant';
import { getEVotingContract } from '~/contracts'

export default {
  name: 'VotePage',
  data() {
    return {
      error: '',
      isLoading: false,
      contractAddress: this.$route.params.id,

      voters,
      usersMerkleTree: new MerkleTree(voters), // TODO: not hardcode voters

      currentBlock: 0,
      finishRegistartionBlock: 0,
      finishVotingBlock: 0,
      finishTallyBlock: 0,
      registrationEndTime: new Date(0),
      votingEndTime: new Date(0),
      tallyEndTime: new Date(0),

      nVoters: voters.length,
      registeredVoters: [],
      votedVoters: [],
      votingKeysX: [],
      votingKeysY: [],
      encryptedVotes: [],
      voteResult: -1,

      voteOption: 0,
    }
  },
  computed: {
    ...mapGetters('wallet', ['getAddress', 'getWeb3']),
    isVoter() {
      return this.getAddress && voters.map(v => v.toLowerCase()).includes(this.getAddress.toLowerCase());
    },
    eVoteInstance() {
      return this.getAddress ? getEVotingContract(this.getWeb3(), this.contractAddress) : null;
    },
    userMerkleProof() {
      return this.getAddress && this.usersMerkleTree.getHexProof(this.getAddress);
    },
    isRegisterPhase() {
      return this.currentBlock < this.finishRegistartionBlock;
    },
    isVotingPhase() {
      return this.currentBlock >= this.finishRegistartionBlock && this.currentBlock < this.finishVotingBlock;
    },
    isTallyingPhase() {
      return this.currentBlock >= this.finishVotingBlock && this.currentBlock < this.finishTallyBlock;
    },
    isRefundPhase() {
      return this.currentBlock >= this.finishTallyBlock;
    },
    voteResultDisplay() {
      if (this.voteResult === -1) return 'No Result';
      if (this.voteResult > this.nVoters / 2) return 'Yes';
      if (this.voteResult < this.nVoters / 2) return 'No';
      return 'Draw';
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
        this.getRegisteredAndVotedVoters(),
        this.getTally(),
        this.updateVotingPhases(),
      ]);
    },
    async getTally() {
      try {
        this.voteResult = await this.eVoteInstance.methods.voteResult().call();
      } catch (err) {
        this.voteResult = -1;
      }
    },
    async getRegisteredAndVotedVoters() {
      const nVoters = await this.eVoteInstance.methods.nVoters().call();
      this.nVoters = nVoters;
      for (let i = 0; i < nVoters; i += 1) {
        try {
          const address = await this.eVoteInstance.methods.voters(i).call();
          this.registeredVoters.push(address);
          console.log(address);
          const publicKeyX = await this.eVoteInstance.methods.publicKeys(address, 0).call();
          const publicKeyY = await this.eVoteInstance.methods.publicKeys(address, 1).call();
          console.log(publicKeyX);
          console.log(publicKeyY);
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
          if ((voteX && voteX !== '0') || (voteY && voteY !== '0')) {
            this.votedVoters.push(address);
          }
          this.encryptedVotes.push([voteX, voteY]);
        } catch (err) {
          console.error(err);
          break;
        }
      }
    },
    async updateVotingPhases() {
      const [currentBlock, finishRegistartionBlock, finishVotingBlock, finishTallyBlock] = await Promise.all([
        this.getWeb3().eth.getBlockNumber(),
        this.eVoteInstance.methods.finishRegistartionBlockNumber().call(),
        this.eVoteInstance.methods.finishVotingBlockNumber().call(),
        this.eVoteInstance.methods.finishTallyBlockNumber().call(),
      ]);
      this.currentBlock = currentBlock;
      this.finishRegistartionBlock = Number(finishRegistartionBlock);
      this.finishVotingBlock = Number(finishVotingBlock);
      this.finishTallyBlock = Number(finishTallyBlock);
      this.registrationEndTime = new Date(currentBlock > this.finishRegistartionBlock ? (await this.getWeb3().eth.getBlock(this.finishRegistartionBlock)).timestamp * 1000 : Date.now() + (this.finishRegistartionBlock - currentBlock) * 12000);
      this.votingEndTime = new Date(currentBlock > this.finishVotingBlock ? (await this.getWeb3().eth.getBlock(this.finishVotingBlock)).timestamp * 1000 : Date.now() + (this.finishVotingBlock - currentBlock) * 12000);
      this.tallyEndTime = new Date(currentBlock > this.finishTallyBlock ? (await this.getWeb3().eth.getBlock(this.finishTallyBlock)).timestamp * 1000 : Date.now() + (this.finishTallyBlock - currentBlock) * 12000);
    },
    async onClickRegister() {
      try {
        this.isLoading = true;
        const {
          publicKey,
          publicKeyProof,
        } = await genPublicKeysAndProof(this.voters.findIndex(v => v.toLowerCase() === this.getAddress.toLowerCase()));
        const tx = await this.eVoteInstance.methods.register(
          publicKey, publicKeyProof.a, publicKeyProof.b, publicKeyProof.c, this.userMerkleProof,
        ).send({ from: this.getAddress, value: web3.utils.toWei(DEPOSIT_VALUE, "ether") });
        console.log(tx);
      } catch (error) {
        console.error(error);
        this.error = error;
      } finally {
        this.isLoading = false;
      }
    },
    async onClickVote() {
      try {
        this.isLoading = true;
        const {
          privateKey,
        } = await genPublicKeysAndProof(this.voters.findIndex(v => v.toLowerCase() === this.getAddress.toLowerCase()));
        const Idx = this.registeredVoters.findIndex(v => v.toLowerCase() === this.getAddress.toLowerCase());
        const { encryptedVote, encryptedVoteProof } = await genEncryptedVotesAndProofs({
          privateKey,
          Idx,
          vote: this.voteOption,
          VotingKeysX: this.votingKeysX,
          VotingKeysY: this.votingKeysY,
        });
        const tx = await this.eVoteInstance.methods.castVote(
          encryptedVote, Idx, encryptedVoteProof.a, encryptedVoteProof.b, encryptedVoteProof.c,
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
  }
}
</script>