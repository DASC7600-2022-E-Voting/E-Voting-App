<template>
  <div>
    <div v-if="!hasVotings">No votings found</div>
    <v-card 
      v-for="v in getVotings" :key="v.contractId"
      dense class="py-1 pl-4 ma-2"
      nuxt :to="`/vote/${v.contractId}`"
    >
      <v-card-text>
        <v-row>{{ `Contract Id: ${v.contractId}` }}</v-row>
        <v-row>{{ `Admin Id: ${v.admin}`}}</v-row>
        <v-row>{{ `Number of Voters: ${v.voters.length}`}}</v-row>
        <v-row>{{ `Initiated at (Block): ${v.currentBlock}`}}</v-row>
        <v-row>{{ `Vote Phases Durations (Blocks): ${phaseDurations(v)}` }}</v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'ListPage',
  data() {
    return {
      error: '',
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters('db', ['getVotings']),
    ...mapGetters('wallet', ['getNetworkId']),
    hasVotings() {
      return this.getVotings && this.getVotings.length;
    },
  },
  watch: {
    getAddress(address) {
      if (address) {
        this.init();
      }
    },
  },
  async mounted() {
    if (!this.getVotings) {
      await this.fetchVotingList({ networkId: this.getNetworkId });
    }
  },
  methods: {
    ...mapActions('db', ['fetchVotingList']),
    phaseDurations(v){
      return [
        v.finishRegistartionBlock - v.currentBlock,
        v.finishVotingBlock - v.finishRegistartionBlock,
        v.finishTallyBlock - v.finishVotingBlock
      ].join(', ')
    }
  }
}
</script>