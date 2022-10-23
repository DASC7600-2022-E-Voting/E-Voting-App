<template>
  <div>
    <div v-if="!hasVotings">No votings found</div>
    <div v-for="v in getVotings" :key="v.contractId">
      <nuxt-link :to="`/vote/${v.contractId}`">{{ v.contractId }}</nuxt-link>
    </div>
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
  }
}
</script>