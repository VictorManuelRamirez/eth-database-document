import { ethers } from 'ethers'
import { useMetaMask } from '@/contexts/MetaMaskContext'
import { ABI } from '@/lib/abi'

export function useContract() {
    const { provider, getSigner } = useMetaMask()

    const getContract = (withSigner = false) => {
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!
        if (withSigner) {
            const signer = getSigner()
            return new ethers.Contract(contractAddress, ABI, signer)
        }
        return new ethers.Contract(contractAddress, ABI, provider)
    }

    // Escribe en blockchain — requiere signer
    const storeDocumentHash = async (
        hash: string,
        timestamp: number,
        signature: string,
        signerAddress: string
    ) => {
        const contract = getContract(true)
        const tx = await contract.storeDocumentHash(hash, timestamp, signature, signerAddress)
        return await tx.wait()  // esperar confirmación
    }

    // Escribe en blockchain — requiere signer
    const verifyDocument = async (
        hash: string,
        signerAddress: string,
        signature: string
    ) => {
        const contract = getContract(true)
        const tx = await contract.verifyDocument(hash, signerAddress, signature)
        return await tx.wait()
    }

    // View functions — solo lectura, sin signer
    const getDocumentInfo = async (hash: string) => {
        const contract = getContract()
        return await contract.getDocumentInfo(hash)
    }

    const isDocumentStored = async (hash: string): Promise<boolean> => {
        const contract = getContract()
        return await contract.isDocumentStored(hash)
    }

    const getDocumentCount = async (): Promise<bigint> => {
        const contract = getContract()
        return await contract.getDocumentCount()
        // ✅ Retorna bigint — usar Number(result) o result.toString() para mostrar
    }

    const getDocumentHashByIndex = async (index: number): Promise<string> => {
        const contract = getContract()
        return await contract.getDocumentHashByIndex(index)
    }

    return {
        storeDocumentHash,
        verifyDocument,
        getDocumentInfo,
        isDocumentStored,
        getDocumentCount,
        getDocumentHashByIndex,
    }
}
