import eVote from './eVote';
import Migrations from './Migrations';
import Pairing from './Pairing';
import verifierMerkleTree from './verifierMerkleTree';
import verifierZKSNARK from './verifierZKSNARK';

export function newEVotingContract(web3, args = []) {
    const contract = new web3.eth.Contract(eVote.abi);
    return contract.deploy({ data: eVote.bytecode, arguments: args });
}

export function getEVotingContract(web3, address) {
    return new web3.eth.Contract(eVote.abi, address)
}

export function newMigrationsContract(web3, args = []) {
    const contract = new web3.eth.Contract(Migrations.abi);
    return contract.deploy({ data: Migrations.bytecode, args });
}

export function getMigrationsContract(web3, address) {
    return new web3.eth.Contract(Migrations.abi, address)
}

export function newPairingContract(web3, args = []) {
    const contract = new web3.eth.Contract(Pairing.abi);
    return contract.deploy({ data: Pairing.bytecode, args });
}

export function getPairingContract(web3, address) {
    return new web3.eth.Contract(Pairing.abi, address)
}

export function newVerifierMerkleTreeContract(web3, args = []) {
    const contract = new web3.eth.Contract(verifierMerkleTree.abi);
    return contract.deploy({ data: verifierMerkleTree.bytecode, args });
}

export function getVerifierMerkleTreeContract(web3, address) {
    return new web3.eth.Contract(verifierMerkleTree.abi, address)
}

export function newVerifierZKSNARKContract(web3, args = []) {
    const contract = new web3.eth.Contract(verifierZKSNARK.abi);
    return contract.deploy({ data: verifierZKSNARK.bytecode, args });
}

export function getVerifierZKSNARKContract(web3, address) {
    return new web3.eth.Contract(verifierZKSNARK.abi, address)
}
