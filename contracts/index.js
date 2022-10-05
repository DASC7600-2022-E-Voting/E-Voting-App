import eVote from './eVote';
import Migrations from './Migrations';
import Pairing from './Pairing';
import verifierMerkleTree from './verifierMerkleTree';
import verifierZKSNARK from './verifierZKSNARK';

export function getEVotingContract(web3, address) {
    return new web3.eth.Contract(eVote.abi, address)
}

export function getMigrationsContract(web3, address) {
    return new web3.eth.Contract(Migrations.abi, address)
}

export function getPairingContract(web3, address) {
    return new web3.eth.Contract(Pairing.abi, address)
}

export function getVerifierMerkleTreeContract(web3, address) {
    return new web3.eth.Contract(verifierMerkleTree.abi, address)
}

export function getVerifierZKSNARKContract(web3, address) {
    return new web3.eth.Contract(verifierZKSNARK.abi, address)
}
