'use client'

import { useState } from 'react'
import { useContract } from '@/hooks/useContract'
import { FileUploader } from './FileUploader'
import { Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

type VerifyResult = 'valid' | 'invalid' | 'not-found' | null

export function DocumentVerifier() {
    const { isDocumentStored, getDocumentInfo } = useContract()

    const [fileHash, setFileHash] = useState<string | null>(null)
    const [signerInput, setSignerInput] = useState('')
    const [result, setResult] = useState<VerifyResult>(null)
    const [loading, setLoading] = useState(false)

    const handleVerify = async () => {
        if (!fileHash || !signerInput) return

        setLoading(true)
        setResult(null)

        try {
            const stored = await isDocumentStored(fileHash)
            if (!stored) {
                setResult('not-found')
                return
            }

            const docInfo = await getDocumentInfo(fileHash)
            // ✅ Comparar en lowercase para evitar falsos negativos por case-sensitivity
            const isValidSigner = docInfo.signer.toLowerCase() === signerInput.toLowerCase()
            setResult(isValidSigner ? 'valid' : 'invalid')
        } catch (err) {
            console.error(err)
            setResult('not-found')
        }
        setLoading(false)
    }

    const resultUI = {
        valid: {
            label: 'VÁLIDO — Documento auténtico y firmante correcto',
            icon: <CheckCircle className="w-5 h-5" />,
            color: 'text-green-400 bg-green-500/10 border-green-500/30',
        },
        invalid: {
            label: 'INVÁLIDO — El firmante no coincide',
            icon: <XCircle className="w-5 h-5" />,
            color: 'text-red-400 bg-red-500/10 border-red-500/30',
        },
        'not-found': {
            label: 'No encontrado — Este documento no está registrado',
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        },
    }

    return (
        <div className="space-y-6">
            <FileUploader onHashCalculated={setFileHash} disabled={loading} />

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dirección del firmante
                </label>
                <input
                    id="input-signer-address"
                    type="text"
                    placeholder="0x..."
                    value={signerInput}
                    onChange={e => setSignerInput(e.target.value)}
                    className="w-full p-3 bg-gray-800/60 border border-gray-700 rounded-xl
                     font-mono text-sm text-gray-200 placeholder-gray-500
                     focus:outline-none focus:border-purple-500/50 transition-colors"
                />
            </div>

            <button
                id="btn-verify-document"
                onClick={handleVerify}
                disabled={loading || !fileHash || !signerInput}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-medium
                   hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 flex items-center justify-center gap-2"
            >
                <Search className="w-4 h-4" />
                {loading ? 'Verificando...' : 'Verificar Documento'}
            </button>

            {result && (
                <div className={`p-4 border rounded-xl font-medium flex items-center gap-3 ${resultUI[result].color}`}>
                    {resultUI[result].icon}
                    <span className="text-sm">{resultUI[result].label}</span>
                </div>
            )}
        </div>
    )
}
