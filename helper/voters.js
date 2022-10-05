const buildBabyjub = require("circomlibjs").buildBabyjub;
const { Scalar } = require("ffjavascript");
const { FullProve } = require('./snarkjsHelper')

const PublicKeyGenWasm = "zk/PublicKeyGen_js/PublicKeyGen.wasm";
const PublicKeyGenZkey = "zk/PublicKeyGenFinal.zkey";

const encryptedVoteGenWasm = "zk/encryptedVoteGen_js/encryptedVoteGen.wasm";
const encryptedVoteGenZkey = "zk/encryptedVoteGenFinal.zkey";

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


async function genPublicKeysAndProofs(count) {
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


    const result = [];
    for (let i = 0; i < count; i++) {
        const privateKey = getPrivate(Math.floor((Math.random() * 10000)));
        const { proof, publicSignals } = await genPublicKey(privateKey);
        const publicKeyProof = {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]],
                [proof.pi_b[1][1], proof.pi_b[1][0]],
            ],
            c: [proof.pi_c[0], proof.pi_c[1]]
        }


        result.push({
            "Idx": i,
            privateKey,
            "publicKey": publicSignals,
            "Vote": Math.floor((Math.random() * 10)) % 2,
            "encryptedVote": null,
            publicKeyProof,
            "encryptedVoteProof": null
        })
    }
    return result
}

async function genEncryptedVotesAndProofs(voters) {
    const VotingKeysX = [];
    const VotingKeysY = [];
    for (let i = 0; i < voters.length; i++) {
        VotingKeysX.push(voters[i].publicKey[0])
        VotingKeysY.push(voters[i].publicKey[1])
    }
    let genWitnessTimeAll = 0;
    let genProofTimeAll = 0;

    for (let i = 0; i < voters.length; i++) {
        const inputs = {
            VotingKeysX,
            VotingKeysY,
            "Idx": voters[i].Idx,
            "xi": voters[i].privateKey,
            "vote": voters[i].Vote
        }
        const { genWitnessTime, genProofTime, proof, publicSignals } = await genEncryptedVote(inputs)
        genWitnessTimeAll += genWitnessTime
        genProofTimeAll += genProofTime
        voters[i].encryptedVote = [publicSignals[0], publicSignals[1]]
        const encryptedVoteProof = {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]],
                [proof.pi_b[1][1], proof.pi_b[1][0]],
            ],
            c: [proof.pi_c[0], proof.pi_c[1]]
        }
        voters[i].encryptedVoteProof = encryptedVoteProof
    }
    console.log(`encryptedVoteGen_genWitnessTime = ${genWitnessTimeAll / voters.length} ms, encryptedVoteGen_genProofTime = ${genProofTimeAll / voters.length} ms`)

}

export async function genTestData(length) {
    const res = await genPublicKeysAndProofs(length);
    await genEncryptedVotesAndProofs(res);
    return res;
}
