'use client'

import { useState } from 'react'
import { useContract } from '@/hooks/useContract'
import { RefreshCw, Database } from 'lucide-react'

interface DocEntry {
    hash: string
    signer: string
    timestamp: bigint
    signature: string
}

// Helper para truncar strings largos
const truncate = (str: string, start = 10, end = 6) =>
    `${str.slice(0, start)}...${str.slice(-end)}`

export function DocumentHistory() {
    const { getDocumentCount, getDocumentHashByIndex, getDocumentInfo } = useContract()
    const [docs, setDocs] = useState<DocEntry[]>([])
    const [loading, setLoading] = useState(false)

    const loadHistory = async () => {
        setLoading(true)
        try {
            const count = await getDocumentCount()
            // ✅ Convertir bigint a number para iterar
            const total = Number(count)
            const entries: DocEntry[] = []

            for (let i = 0; i < total; i++) {
                const hash = await getDocumentHashByIndex(i)
                const info = await getDocumentInfo(hash)
                entries.push({
                    hash,
                    signer: info.signer,
                    timestamp: info.timestamp,   // bigint desde el contrato
                    signature: info.signature,
                })
            }
            setDocs(entries)
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    return (
        <div className="space-y-4">
            <button
                id="btn-load-history"
                onClick={loadHistory}
                disabled={loading}
                className="py-3 px-5 bg-gray-700 text-white rounded-xl font-medium
                   hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 flex items-center gap-2"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Cargando...' : 'Cargar Historial'}
            </button>

            {docs.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-700">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-800/80 border-b border-gray-700">
                                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hash</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Firmante</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Firma</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((doc, i) => (
                                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                                    <td className="p-3 font-mono text-xs text-amber-400/80">{truncate(doc.hash)}</td>
                                    <td className="p-3 font-mono text-xs text-gray-300">{truncate(doc.signer, 8, 4)}</td>
                                    {/* ✅ Convertir bigint timestamp a Date */}
                                    <td className="p-3 text-xs text-gray-400">
                                        {new Date(Number(doc.timestamp) * 1000).toLocaleString()}
                                    </td>
                                    <td className="p-3 font-mono text-xs text-gray-500">{truncate(doc.signature, 20, 6)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {docs.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                        <Database className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-gray-500 text-sm">Sin documentos registrados.</p>
                    <p className="text-gray-600 text-xs mt-1">Carga el historial para ver documentos almacenados.</p>
                </div>
            )}
        </div>
    )
}
