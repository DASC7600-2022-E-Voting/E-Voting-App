<template>
    <div>
        <div v-if="error">{{ error }}</div>
        <a
            v-if="showInstallMetaMask"
            href="https://metamask.io/"
            target="_blank"
        >Install MetaMask</a>
        <div v-else-if="getAddress">{{ getAddress }}</div>
        <v-btn v-else @click.stop="onClickConnectWallet">Connect wallet</v-btn>
    </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
export default {
    name: 'WalletStatus',
    data() {
        return {
            showInstallMetaMask: false,
            error: '',
        };
    },
    computed: {
        ...mapGetters('wallet', ['getAddress']),
    },
    mounted() {
        this.showInstallMetaMask = !window.ethereum;
    },
    methods: {
        ...mapActions('wallet', ['initWallet']),
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
