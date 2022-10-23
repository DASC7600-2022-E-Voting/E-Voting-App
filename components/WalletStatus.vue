<template>
    <v-row>
        <div v-if="error">{{ error }}</div>
        <v-select :items="networkItems" label="Network" :value="networkValue" @change="onChangeNetwork" />
        <a v-if="showInstallMetaMask" href="https://metamask.io/" target="_blank">Install MetaMask</a>
        <span v-else-if="getAddress">{{ getAddress }}</span>
        <v-btn v-else @click.stop="onClickConnectWallet">Connect wallet</v-btn>
    </v-row>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { NETWORKS } from '~/constant';
export default {
    name: 'WalletStatus',
    data() {
        return {
            showInstallMetaMask: false,
            NETWORKS,
            networkValue: this.getNetworkId || NETWORKS[0].chainId,
            error: '',
        };
    },
    computed: {
        ...mapGetters('wallet', ['getAddress', 'getNetworkId']),
        networkItems() {
            return this.NETWORKS.map(n =>
            ({
                text: n.displayName,
                value: n.chainId,
            }));
        },
    },
    mounted() {
        this.showInstallMetaMask = !window.ethereum;
    },
    methods: {
        ...mapActions('wallet', ['initWallet', 'switchNetwork']),
        async onChangeNetwork(e) {
            this.networkValue = e;
            await this.switchNetwork(e);
        },
        async onClickConnectWallet() {
            let res = false;
            try {
                res = await this.initWallet();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
                this.error = error;
            }
            if (!res) {
                // this.goToMetamaskPage();
            }
        },
        goToMetamaskPage() {
            window.open('https://metamask.io/');
        },
    }
}
</script>
