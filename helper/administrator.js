const { FullProve } = require('./snarkjsHelper')
const tallyingWasm = "/zk/tallying_js/tallying.wasm";
const tallyingZkey = "/zk/tallyingFinal.zkey";


export async function tallying(encryptedVotes) {
    const encryptedVotesX = [];
    const encryptedVotesY = [];
    for (let i = 0; i < encryptedVotes.length; i++) {
        encryptedVotesX.push(encryptedVotes[i][0])
        encryptedVotesY.push(encryptedVotes[i][1])
    }
    const { genWitnessTime, genProofTime, proof, publicSignals } = await FullProve(
        {
            encryptedVotesX,
            encryptedVotesY
        },
        tallyingWasm,
        tallyingZkey,
    );
    console.log(`Tallying_genWitnessTime = ${genWitnessTime} ms, Tallying_genProofTime = ${genProofTime} ms`)
    const tallyingResult = publicSignals[0];
    const tallyingProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]],
        ],
        c: [proof.pi_c[0], proof.pi_c[1]]
    }

    return { tallyingProof, tallyingResult }
}
