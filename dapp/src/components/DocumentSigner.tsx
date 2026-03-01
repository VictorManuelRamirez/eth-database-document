'use client'

import { useState } from 'react'
import { useMetaMask } from '@/contexts/MetaMaskContext'
import { useContract } from '@/hooks/useContract'
import { FileUploader } from './FileUploader'
import { PenLine, Link } from 'lucide-react'

export function DocumentSigner() {
    const { isConnected, currentWallet, signMessage } = useMetaMask()
    const { storeDocumentHash } = useContract()

    const [documentHash, setDocumentHash] = useState<string | null>(null)
    const [signature, setSignature] = useState<string | null>(null)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSign = async () => {
        if (!documentHash || !currentWallet) return

        const confirmed = window.confirm(
            `¿Firmar el siguiente documento?\n\nHash: ${documentHash}\nFirmante: ${currentWallet.address}`
        )
        if (!confirmed) return

        setLoading(true)
        try {
            // ✅ signMessage usa ethers.getBytes() internamente — firma sobre bytes raw
            const sig = await signMessage(documentHash)
            setSignature(sig)
            window.alert(`✅ Documento firmado correctamente.\n\nFirma:\n${sig.slice(0, 40)}...`)
        } catch (err) {
            window.alert(`❌ Error al firmar: ${err}`)
        }
        setLoading(false)
    }

    const handleStore = async () => {
        if (!documentHash || !signature || !currentWallet) return

        const confirmed = window.confirm(
            '¿Almacenar este documento en la blockchain?\nEsta acción es irreversible.'
        )
        if (!confirmed) return

        setLoading(true)
        try {
            const timestamp = Math.floor(Date.now() / 1000)
            const receipt = await storeDocumentHash(
                documentHash,
                timestamp,
                signature,
                currentWallet.address
            )
            setTxHash(receipt.hash)
            window.alert(`✅ Documento almacenado.\n\nTx Hash: ${receipt.hash}`)
        } catch (err) {
            window.alert(`❌ Error al almacenar: ${err}`)
        }
        setLoading(false)
    }

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <PenLine className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-gray-400 text-sm">Conecta tu wallet para firmar documentos.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <FileUploader onHashCalculated={setDocumentHash} disabled={loading} />

            {documentHash && !signature && (
                <button
                    id="btn-sign-document"
                    onClick={handleSign}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium
                     hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <PenLine className="w-4 h-4" />
                    {loading ? 'Firmando...' : 'Firmar Documento'}
                </button>
            )}

            {signature && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">✍️ Firma generada:</label>
                        <textarea
                            readOnly
                            value={signature}
                            rows={3}
                            className="w-full p-3 text-xs font-mono bg-gray-800/60 border border-gray-700
                         rounded-xl text-green-400/80 resize-none focus:outline-none"
                        />
                    </div>
                    <button
                        id="btn-store-blockchain"
                        onClick={handleStore}
                        disabled={loading || !!txHash}
                        className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200
                       flex items-center justify-center gap-2 ${txHash
                                ? 'bg-green-600/20 text-green-400 border border-green-600/30 cursor-default'
                                : 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50'
                            }`}
                    >
                        <Link className="w-4 h-4" />
                        {loading ? 'Almacenando...' : txHash ? '✅ Almacenado en Blockchain' : 'Almacenar en Blockchain'}
                    </button>
                </div>
            )}

            {txHash && (
                <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1 font-medium">🔗 Transaction Hash:</p>
                    <p className="text-xs text-amber-400/90 font-mono break-all">{txHash}</p>
                </div>
            )}
        </div>
    )
}
