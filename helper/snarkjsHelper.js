const snarkjs = require('snarkjs/build/main.cjs')

export const FullProve = async (inputSignals, wasm, zkey) => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputSignals, wasm, zkey);
    return { genWitnessTime: null, genProofTime: null, proof, publicSignals}
}
