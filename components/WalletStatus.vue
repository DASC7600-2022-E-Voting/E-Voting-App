<template>
    <v-row>
        <v-btn
            v-if="error"
            small
            @click.stop="errorDialog=true"
        >
            <v-icon>mdi-alert</v-icon>
        </v-btn>
        <v-select 
            dense single-line label="Network"
            :items="networkItems" 
            :value="networkValue"
            @change="onChangeNetwork"
        />
        <a v-if="showInstallMetaMask" href="https://metamask.io/" target="_blank">Install MetaMask</a>
        <span v-else-if="getAddress">{{ getAddress }}</span>
        <v-btn v-else color="green" @click.stop="onClickConnectWallet">Connect wallet</v-btn>
        <v-dialog v-model="errorDialog">
            <v-card>
                <v-card-title>Wallet Error</v-card-title>
                <v-card-text>{{error}}</v-card-text>
                <v-btn 
                    text
                    @click="errorDialog=false"
                >OK</v-btn>
            </v-card>
        </v-dialog>
        
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
            errorDialog: false,
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
    watch: {
        error(nv){
            this.errorDialog = nv !== ''
        }
    },
    mounted() {
        this.showInstallMetaMask = !window.ethereum;
    },
    methods: {
        ...mapActions('wallet', ['initWallet', 'switchNetwork']),
        async onChangeNetwork(e) {
            this.networkValue = e;
            try {
                await this.switchNetwork(e);
                this.error = ''
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
                this.error = error;
            }
        },
        async onClickConnectWallet() {
            let res = false;
            try {
                this.error = ''
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
