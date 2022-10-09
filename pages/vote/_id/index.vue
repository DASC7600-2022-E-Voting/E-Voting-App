<template>
  <div>
    <div v-if="error">{{ error }}</div>
    <div v-if="!isVoter">You are not voter!</div>
    <div>
      <v-btn :disabled="!isVoter" @click="onClickRegister">Register</v-btn>
    </div>
    <div>
      <label>Vote option:</label>
      <input v-model="voteOption" :disabled="!isVoter"></input>
      <v-btn :disabled="!isVoter" @click="onClickVote">Vote</v-btn>
    </div>
    <div>
      <v-btn :disabled="!isVoter" @click="onClickRefund">Refund</v-btn>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import web3 from 'web3';
import { MerkleTree } from '~/helper/merkletree';
import { voters } from '~/constant/stub'
import { DEPOSIT_VALUE } from '~/constant';
import { getEVotingContract } from '~/contracts'

export default {
  name: 'VotePage',
  data() {
    return {
      error: '',
      contractAddress: this.$route.params.id,
      usersMerkleTree: new MerkleTree(voters), // TODO: not hardcode voter
      voteOption: 0,
      voterData: {}, // TODO: fill in zk info
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
  },
  methods: {
    async onClickRegister() {
      try {
        const {
          publicKey = [],
          publicKeyProof = { a: [1, 2], b: [[3, 4], [5, 6]], c: [5, 6] },
        } = this.voterData;
        const tx = await this.eVoteInstance.methods.register(
          publicKey, publicKeyProof.a, publicKeyProof.b, publicKeyProof.c, this.userMerkleProof,
        ).send({ from: this.getAddress, value: web3.utils.toWei(DEPOSIT_VALUE, "ether") });
        console.log(tx);
      } catch (error) {
        console.error(error);
        this.error = error;
      }
    },
    async onClickVote() {
      try {
        const voteData = { voteOption: this.voteOption }; // TODO: generate zk proof
        const {
          encryptedVote = [1, 2],
          Idx = '1',
          encryptedVoteProof = { a: [1, 2], b: [[3, 4], [5, 6]], c: [5, 6] },
        } = voteData;
        const tx = await this.eVoteInstance.methods.castVote(
          encryptedVote, Idx, encryptedVoteProof.a, encryptedVoteProof.b, encryptedVoteProof.c,
        ).send({ from: this.getAddress });
        console.log(tx);
      } catch (error) {
        console.error(error);
        this.error = error;
      }
    },
    async onClickRefund() {
      try {
        const current = await web3.eth.getBlockNumber()
        const targetBlock = (await this.eVoteInstance.methods.finishTallyBlockNumber().call()).toNumber();
        if (current < targetBlock) throw new Error(`Block ${targetBlock} not reached`);
        const tx = await this.eVoteInstance.methods.refund().send({ from: this.getAddress });
        console.log(tx);
      } catch (error) {
        console.error(error);
        this.error = error;
      }
    },
  }
}
</script>