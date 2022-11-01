<template>
  <div>
    <h2>Voting Status</h2>
    <v-card dense class="py-1 pl-4 ma-2">
      <v-card-text>
        <div>Voters Expected: {{ nVoters }}</div>
        <div>Voters Registered: {{ registeredVoters.length }}</div>
        <div>Voters Voted: {{ votedVoters.length }}</div>
        <div>Tally Result: {{ voteResultDisplay }}</div>
      </v-card-text>
    </v-card>

    <span>For admins: </span><nuxt-link :to="`/vote/${contractAddress}/admin`">go to admin page</nuxt-link>
  
    <h2>Voting Actions</h2>
    <v-alert v-if="!getAddress && !isLoading" type="error" color="red darken-4">
      Please connect your wallet first
    </v-alert>

    <v-alert v-else-if="!isVoter && !isLoading" type="error" color="red darken-4">
      You are not voter. Please connect to a voter account.
    </v-alert>

    <template v-else>
      <v-card dense class="py-1 pl-4 ma-2">
        <v-card-title class="pa-2">Registration</v-card-title>
        <v-card-text>
          <div>Registration end time: {{ registrationEndTime }}</div>
          <div>
            <template v-if="isRegisterPhase">
              <div v-if="isRegisteredVoter">You have already registered.</div>
              <div v-else>Please Register as voter</div>
              <v-btn
                :disabled="!!error || !isVoter || !isRegisterPhase || isLoading || isRegisteredVoter"
                color="green"
                @click="onClickRegister"
              >
                Register
              </v-btn>
            </template>
            <div v-else>It is not register phase currently.</div>
          </div>
        </v-card-text>
      </v-card>
      <v-card dense class="py-1 pl-4 ma-2">
        <v-card-title class="pa-2">Vote Casting</v-card-title>
        <v-card-text>
          <div>Voting end time: {{ votingEndTime }}</div>
          <template v-if="isVotingPhase">
            <div v-if="isVotedVoter">You have already voted.</div>
            <template v-else>
              <div>Please Vote</div>
              <v-radio-group
                v-model="voteOption"
                row dense
              >
                <v-radio label="Vote 0" :value="0" />
                <v-radio label="Vote 1" :value="1" />
              </v-radio-group>
              <v-btn
                :disabled="!!error || !isVoter || !isVotingPhase || isVotedVoter || isLoading || voteOption == null" 
                color="green"
                @click="onClickVote"
              >
                Vote
              </v-btn>
            </template>
          </template>
          <div v-else>It is not voting phase currently.</div>
        </v-card-text>
      </v-card>
      <v-card dense class="py-1 pl-4 ma-2">
        <v-card-title class="pa-2">Refunding</v-card-title>
        <v-card-text>
          <div>Refunding start time: {{ tallyEndTime }}</div>
          <template v-if="isRefundPhase">
            <div>Please refund here</div>
            <v-btn
              :disabled="!!error || !isVoter || !isRefundPhase || isLoading"
              color="green"
              @click="onClickRefund"
            >
              Refund
            </v-btn>
          </template>
          <div v-else>It is not refund phase currently.</div>
        </v-card-text>
      </v-card>
    </template>

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

      voteOption: null,
    }
  },
  computed: {
    ...mapGetters('wallet', ['getAddress', 'getWeb3', 'getBlockTime']),
    ...mapGetters('db', ['getVotingById']),
    voters() {
      const storedInfo = this.getVotingById(this.contractAddress);
      if (storedInfo) {
        return storedInfo.voters;
      }
      return voters;
    },
    usersMerkleTree() {
      return new MerkleTree(this.voters);
    },
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
    isRegisteredVoter() {
      return this.registeredVoters.map(address => address.toLowerCase()).includes(this.getAddress)
    },
    isVotedVoter() {
      return this.votedVoters.map(address => address.toLowerCase()).includes(this.getAddress)
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
      this.isLoading = true
      this.error = ''
      try {
        await Promise.all([
          this.getRegisteredAndVotedVoters(),
          this.getTally(),
          this.updateVotingPhases(),
        ]);
      } catch (error) {
        this.error = error
      } finally {
        this.isLoading = false
      }
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
      this.registeredVoters = [];
      this.votingKeysX = [];
      this.votingKeysY = [];
      this.votedVoters = [];
      this.encryptedVotes = [];
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
          if ((voteX && voteX !== '0') || (voteY && voteY !== '0')) {
            this.votedVoters.push(address);
          }
          this.encryptedVotes.push([voteX, voteY]);
        } catch (err) {
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
      const blockTime = this.getBlockTime;
      this.registrationEndTime = new Date(currentBlock > this.finishRegistartionBlock ? (await this.getWeb3().eth.getBlock(this.finishRegistartionBlock)).timestamp * 1000 : Date.now() + (this.finishRegistartionBlock - currentBlock) * blockTime * 1000);
      this.votingEndTime = new Date(currentBlock > this.finishVotingBlock ? (await this.getWeb3().eth.getBlock(this.finishVotingBlock)).timestamp * 1000 : Date.now() + (this.finishVotingBlock - currentBlock) * blockTime * 1000);
      this.tallyEndTime = new Date(currentBlock > this.finishTallyBlock ? (await this.getWeb3().eth.getBlock(this.finishTallyBlock)).timestamp * 1000 : Date.now() + (this.finishTallyBlock - currentBlock) * blockTime * 1000);
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
        // eslint-disable-next-line no-console
        console.log(tx);
        await this.getRegisteredAndVotedVoters();
      } catch (error) {
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.log(tx);
        await this.getRegisteredAndVotedVoters();
      } catch (error) {
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.log(tx);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.error = error;
      } finally {
        this.isLoading = false;
      }
    },
  }
}
</script>