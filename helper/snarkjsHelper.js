const snarkjs = require('snarkjs')

export const FullProve = async (inputSignals, wasm, zkey) => {
    let t = process.hrtime();
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputSignals, wasm, zkey);
    t = process.hrtime(t);
    const genProofTime =  t[0]*1000 + t[1]/1e6;
    return { genWitnessTime: null, genProofTime, proof, publicSignals}
}
