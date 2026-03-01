'use client'

import { useState } from 'react'
import { useMetaMask } from '@/contexts/MetaMaskContext'
import { DocumentSigner } from '@/components/DocumentSigner'
import { DocumentVerifier } from '@/components/DocumentVerifier'
import { DocumentHistory } from '@/components/DocumentHistory'
import { Upload, CheckCircle, Clock, Shield, Wallet, LogOut } from 'lucide-react'

type Tab = 'upload' | 'verify' | 'history'

const tabs = [
  { id: 'upload' as Tab, label: 'Upload & Sign', icon: Upload, description: 'Upload files and sign them with your wallet' },
  { id: 'verify' as Tab, label: 'Verify', icon: CheckCircle, description: 'Verify document authenticity' },
  { id: 'history' as Tab, label: 'History', icon: Clock, description: 'View document history' },
]

export default function Home() {
  const { isConnected, currentWallet, availableWallets, connect, disconnect, switchWallet } = useMetaMask()
  const [activeTab, setActiveTab] = useState<Tab>('upload')

  return (
    <main className="min-h-screen bg-[#0b1120] text-gray-100">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Secure Document Verification
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto">
            Store, sign, and verify document hashes on the blockchain with complete transparency and security.
          </p>
        </div>

        {/* Debug Info Panel */}
        <div className="mb-6 p-4 bg-gray-900/60 border border-gray-800 rounded-xl text-xs font-mono">
          <p className="text-gray-500 font-medium mb-2 text-[11px] uppercase tracking-wider">Debug Info:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-gray-500">
            <p>Connected: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>{isConnected ? 'Yes' : 'No'}</span></p>
            <p>Account: <span className="text-gray-400">{currentWallet ? `${currentWallet.address.slice(0, 8)}...${currentWallet.address.slice(-6)}` : 'None'}</span></p>
            <p>Chain ID: <span className="text-gray-400">{process.env.NEXT_PUBLIC_CHAIN_ID || '31337'}</span></p>
            <p>Contract: <span className="text-gray-400">{process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ? `${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS.slice(0, 10)}...` : 'Not set'}</span></p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-3 rounded-xl text-sm font-medium
                           transition-all duration-200 border ${activeTab === tab.id
                    ? 'bg-gray-800/80 border-amber-500/30 text-white shadow-lg shadow-amber-500/5'
                    : 'bg-transparent border-gray-800 text-gray-500 hover:bg-gray-800/40 hover:text-gray-300'
                  }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-amber-500' : ''}`} />
                <span className="text-xs">{tab.label}</span>
                <span className="text-[10px] text-gray-600 hidden sm:block">{tab.description}</span>
              </button>
            )
          })}
        </div>

        {/* Wallet Connection or Content */}
        {!isConnected ? (
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
              <Wallet className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              Please select an Anvil wallet to access the dApp features and start verifying documents.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-w-lg mx-auto">
              {availableWallets.slice(0, 10).map(w => (
                <button
                  key={w.index}
                  id={`btn-connect-wallet-${w.index}`}
                  onClick={() => connect(w.index)}
                  className="py-2 px-3 bg-gray-800 border border-gray-700 rounded-lg text-xs
                             text-gray-300 hover:bg-gray-700 hover:border-amber-500/30
                             transition-all duration-200 font-mono"
                >
                  W{w.index}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected Wallet Bar */}
            <div className="flex items-center justify-between bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-400">Wallet:</span>
                <select
                  id="select-wallet"
                  onChange={e => switchWallet(Number(e.target.value))}
                  value={currentWallet?.index}
                  className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1
                             text-gray-300 font-mono focus:outline-none focus:border-amber-500/50"
                >
                  {availableWallets.map(w => (
                    <option key={w.index} value={w.index}>
                      Wallet {w.index}: {w.address.slice(0, 6)}...{w.address.slice(-4)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                id="btn-disconnect"
                onClick={disconnect}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Desconectar
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
              {activeTab === 'upload' && <DocumentSigner />}
              {activeTab === 'verify' && <DocumentVerifier />}
              {activeTab === 'history' && <DocumentHistory />}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <p className="text-xs text-gray-600">
          ⛓️ DocChain · Powered by Ethereum & Solidity · Local Anvil Network
        </p>
      </div>
    </main>
  )
}
