<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
      <v-card class="mt-4">
        <v-card-title class="headline">
          Self-tallying E-Voting DApp using zk-SNARKs
        </v-card-title>
        <v-card-text>
          <p>
            Our work is based on the paper <i>Elsheikh, Muhammad & Youssef, Amr. (2022). Dispute-free Scalable Open Vote Network using zk-SNARKs.</i>
            We have modified the proposed functions to allow the proposed model and smart contracts to be deployed and used as a DApp.
            Users can setup and vote using MetaMask or other web3 compatible wallet.
          </p>
          <p>
            For more information on the protocol, check out the original
            <a
              href="https://arxiv.org/abs/2203.03363"
              target="_blank"
              rel="noopener noreferrer"
            >
              paper</a
            >.
          </p>
          <p>
            Smart contract are taken and modified from the code provided by the original paper authors, which can be found
            <a
              href="https://github.com/mhgharieb/zkSNARK-Open-Vote-Network"
              target="_blank"
              rel="noopener noreferrer"
              title="chat"
            >
              here</a
            >.
          </p>
          <p>
            Interested in contributing to our work? Take a look at our 
            <a
              href="https://github.com/DASC7600-2022-E-Voting/E-Voting-App"
              target="_blank"
              rel="noopener noreferrer"
              title="contribute"
            >
              GitHub</a
            >.
          </p>
          <p>
            Thank you for using our app!
          </p>
          <hr class="my-3" />
          <a
            href="https://github.com/DASC7600-2022-E-Voting"
            target="_blank"
            rel="noopener noreferrer"
          >
            Our GitHub
          </a>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" nuxt to="/setup"> Continue </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'IndexPage',
}
</script>
