'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'

// ✅ Ethers.js v6 — usar HDNodeWallet.fromPhrase (NO Wallet.fromMnemonic)
const ANVIL_MNEMONIC = process.env.NEXT_PUBLIC_MNEMONIC || ''

// Derivar las 10 cuentas del mnemonic estándar de Anvil
// IMPORTANTE: ejecutar solo en cliente (no en SSR) para evitar Hydration errors
const deriveWallets = () =>
    Array.from({ length: 10 }, (_, i) => {
        const path = `m/44'/60'/0'/0/${i}`
        const wallet = ethers.HDNodeWallet.fromPhrase(ANVIL_MNEMONIC, undefined, path)
        return { address: wallet.address, privateKey: wallet.privateKey, index: i }
    })

// Provider conectado a Anvil local
const provider = new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
)

interface WalletInfo {
    address: string
    privateKey: string
    index: number
}

interface MetaMaskContextType {
    isConnected: boolean
    currentWallet: WalletInfo | null
    availableWallets: WalletInfo[]
    provider: ethers.JsonRpcProvider
    connect: (walletIndex: number) => void
    disconnect: () => void
    signMessage: (message: string) => Promise<string>
    getSigner: () => ethers.Wallet
    switchWallet: (walletIndex: number) => void
}

const MetaMaskContext = createContext<MetaMaskContextType | null>(null)

export function MetaMaskProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false)
    const [currentWallet, setCurrentWallet] = useState<WalletInfo | null>(null)
    // ✅ Cargar wallets en useEffect para evitar Hydration error en Next.js
    const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([])

    useEffect(() => {
        setAvailableWallets(deriveWallets())
    }, [])

    const connect = (walletIndex: number) => {
        const wallet = availableWallets[walletIndex]
        if (wallet) {
            setCurrentWallet(wallet)
            setIsConnected(true)
        }
    }

    const disconnect = () => {
        setCurrentWallet(null)
        setIsConnected(false)
    }

    const getSigner = (): ethers.Wallet => {
        if (!currentWallet) throw new Error('No wallet connected')
        return new ethers.Wallet(currentWallet.privateKey, provider)
    }

    const signMessage = async (message: string): Promise<string> => {
        const signer = getSigner()
        // ✅ Firmar sobre bytes raw, consistente con ecrecover en el contrato
        return await signer.signMessage(ethers.getBytes(message))
    }

    const switchWallet = (walletIndex: number) => connect(walletIndex)

    return (
        <MetaMaskContext.Provider value={{
            isConnected, currentWallet, availableWallets, provider,
            connect, disconnect, signMessage, getSigner, switchWallet
        }}>
            {children}
        </MetaMaskContext.Provider>
    )
}

export const useMetaMask = () => {
    const ctx = useContext(MetaMaskContext)
    if (!ctx) throw new Error('useMetaMask must be used within MetaMaskProvider')
    return ctx
}
