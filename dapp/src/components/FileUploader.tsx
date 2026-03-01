'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { Upload } from 'lucide-react'

interface FileUploaderProps {
    onHashCalculated: (hash: string) => void
    disabled?: boolean
}

export function FileUploader({ onHashCalculated, disabled }: FileUploaderProps) {
    const [fileName, setFileName] = useState<string | null>(null)
    const [hash, setHash] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [fileSize, setFileSize] = useState<number | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        setFileName(file.name)
        setFileSize(file.size)

        // ✅ Calcular hash keccak256 del contenido binario del archivo
        const buffer = await file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        const fileHash = ethers.keccak256(bytes)  // retorna '0x...'

        setHash(fileHash)
        onHashCalculated(fileHash)
        setLoading(false)
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="space-y-4">
            <label
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${disabled || loading
                        ? 'border-gray-700 bg-gray-800/30 cursor-not-allowed'
                        : 'border-gray-600 bg-gray-800/50 hover:border-amber-500/50 hover:bg-gray-800/70'
                    }`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`w-8 h-8 mb-2 ${loading ? 'animate-pulse text-amber-400' : 'text-gray-400'}`} />
                    <p className="text-sm text-gray-400">
                        {loading ? 'Calculando hash...' : fileName ? fileName : 'Click para seleccionar archivo'}
                    </p>
                    {fileSize && <p className="text-xs text-gray-500 mt-1">{formatSize(fileSize)}</p>}
                </div>
                <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={disabled || loading}
                    className="hidden"
                />
            </label>

            {hash && (
                <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1 font-medium">📋 Hash Keccak256:</p>
                    <p className="text-xs text-amber-400/90 font-mono break-all">{hash}</p>
                </div>
            )}
        </div>
    )
}
