const buildBabyjub = require("circomlibjs").buildBabyjub;
const { Scalar } = require("ffjavascript");
const { FullProve } = require('./snarkjsHelper')

const PublicKeyGenWasm = "/zk/PublicKeyGen_js/PublicKeyGen.wasm";
const PublicKeyGenZkey = "/zk/PublicKeyGenFinal.zkey";

const encryptedVoteGenWasm = "/zk/encryptedVoteGen_js/encryptedVoteGen.wasm";
const encryptedVoteGenZkey = "/zk/encryptedVoteGenFinal.zkey";

async function genPublicKey(privateKey) {
    const { proof, publicSignals } = await FullProve(
        { privateKey },
        PublicKeyGenWasm,
        PublicKeyGenZkey,
    );
    return { proof, publicSignals }
}

async function genEncryptedVote(inputs) {
    const { genWitnessTime, genProofTime, proof, publicSignals } = await FullProve(
        inputs,
        encryptedVoteGenWasm,
        encryptedVoteGenZkey,
    );
    return { genWitnessTime, genProofTime, proof, publicSignals }
}

export async function genPublicKeysAndProof(index) {
    const babyJub = await buildBabyjub();
    // const p = babyJub.p;
    const F = babyJub.F;
    const BASE8 = babyJub.Base8;
    const q = babyJub.subOrder;
    const pm1d2 = babyJub.pm1d2;

    const getPrivate = (x) => {
        const pk = babyJub.mulPointEscalar(BASE8, x);
        if (Scalar.gt(F.toObject(pk[0]), pm1d2)) {
            return (Scalar.sub(q, x)).toString()
        }
        return x.toString();
    }
    const privateKey = getPrivate(index);
    const { proof, publicSignals } = await genPublicKey(privateKey);
    const publicKeyProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]],
        ],
        c: [proof.pi_c[0], proof.pi_c[1]]
    }

    return {
        Idx: index,
        privateKey,
        publicKey: publicSignals,
        publicKeyProof,
    };
}

export async function genEncryptedVotesAndProofs({
    privateKey,
    Idx,
    vote,
    VotingKeysX,
    VotingKeysY,
}) {
    let genWitnessTimeAll = 0;
    let genProofTimeAll = 0;
    const inputs = {
        VotingKeysX,
        VotingKeysY,
        Idx,
        xi: privateKey,
        vote
    }
    const { genWitnessTime, genProofTime, proof, publicSignals } = await genEncryptedVote(inputs)
    genWitnessTimeAll += genWitnessTime
    genProofTimeAll += genProofTime
    const encryptedVote = [publicSignals[0], publicSignals[1]]
    const encryptedVoteProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]],
        ],
        c: [proof.pi_c[0], proof.pi_c[1]]
    }
    console.log(`encryptedVoteGen_genWitnessTime = ${genWitnessTimeAll} ms, encryptedVoteGen_genProofTime = ${genProofTimeAll} ms`)
    return { encryptedVote, encryptedVoteProof };
}
