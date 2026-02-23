# dApp — Verificación de Documentos en Blockchain
### Especificación para Cursor AI · Ethereum · Solidity · Foundry · Next.js · TypeScript · Ethers.js v6

---

## 🧠 Contexto para la IA

Este documento es una guía de implementación completa. Cursor AI debe leerlo **en su totalidad antes de escribir cualquier línea de código**. Cada fase depende de la anterior. Seguir el orden estrictamente.

### Stack tecnológico obligatorio

| Capa | Tecnología | Versión |
|---|---|---|
| Smart Contracts | Solidity + Foundry (Forge, Anvil, Cast) | `^0.8.19` |
| Frontend Framework | Next.js + TypeScript | `14+` |
| Estilos | Tailwind CSS | `3+` |
| Librería Web3 | Ethers.js | `v6` (NO v5) |
| Nodo local | Anvil | Foundry toolkit |
| Autenticación | Wallets desde mnemonic | Sin MetaMask |

### Principios de arquitectura (NO negociables)

- ❌ Los archivos **NUNCA** se almacenan en blockchain ni en IPFS
- ✅ Solo el **hash keccak256** del archivo vive en blockchain
- ✅ El frontend usa `JsonRpcProvider`, **NO** `BrowserProvider` ni MetaMask
- ✅ Las wallets se derivan desde el mnemonic de Anvil con `ethers.HDNodeWallet.fromPhrase()`
- ❌ **NO** usar `ethers.Wallet.fromMnemonic()` — esa es API de Ethers.js v5 y lanzará error

---

## 📁 Estructura de Archivos

La IA debe crear exactamente esta estructura de directorios:

```
proyecto-raiz/
├── sc/                                  ← Smart Contracts (Foundry)
│   ├── src/
│   │   └── DocumentRegistry.sol
│   ├── test/
│   │   └── DocumentRegistry.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
│
└── dapp/                                ← Frontend (Next.js)
    ├── app/
    │   └── page.tsx
    ├── components/
    │   ├── FileUploader.tsx
    │   ├── DocumentSigner.tsx
    │   ├── DocumentVerifier.tsx
    │   └── DocumentHistory.tsx
    ├── contexts/
    │   └── MetaMaskContext.tsx
    ├── hooks/
    │   └── useContract.ts
    ├── lib/
    │   └── abi.ts
    ├── .env.local
    └── package.json
```

---

## 🔧 Fase 1: Smart Contracts

> **Objetivo:** Implementar, probar y desplegar el contrato `DocumentRegistry` en Anvil.

### 1.1 Contrato principal

**Archivo:** `sc/src/DocumentRegistry.sol`

Implementar el contrato completo con la siguiente estructura. La IA NO debe agregar campos ni mappings adicionales.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentRegistry {

    // ✅ Struct optimizado — sin bool exists, sin mapping hashExists
    struct Document {
        bytes32 hash;
        uint256 timestamp;
        address signer;
        bytes signature;
    }

    mapping(bytes32 => Document) public documents;
    bytes32[] public documentHashes;

    event DocumentStored(bytes32 indexed hash, address indexed signer, uint256 timestamp);
    event DocumentVerified(bytes32 indexed hash, address indexed signer, bool isValid);

    // Modifiers de seguridad
    modifier documentNotExists(bytes32 _hash) {
        require(documents[_hash].signer == address(0), "Document already exists");
        _;
    }

    modifier documentExists(bytes32 _hash) {
        require(documents[_hash].signer != address(0), "Document does not exist");
        _;
    }

    // 1. Almacenar documento nuevo
    function storeDocumentHash(
        bytes32 _hash,
        uint256 _timestamp,
        bytes memory _signature,
        address _signer
    ) external documentNotExists(_hash) {
        documents[_hash] = Document({
            hash: _hash,
            timestamp: _timestamp,
            signer: _signer,
            signature: _signature
        });
        documentHashes.push(_hash);
        emit DocumentStored(_hash, _signer, _timestamp);
    }

    // 2. Verificar documento existente
    function verifyDocument(
        bytes32 _hash,
        address _signer,
        bytes memory _signature
    ) external documentExists(_hash) returns (bool) {
        Document memory doc = documents[_hash];
        bool isValid = doc.signer == _signer &&
                       keccak256(doc.signature) == keccak256(_signature);
        emit DocumentVerified(_hash, _signer, isValid);
        return isValid;
    }

    // 3. Obtener información completa
    function getDocumentInfo(bytes32 _hash)
        external view documentExists(_hash) returns (Document memory) {
        return documents[_hash];
    }

    // 4. Verificar si existe (sin revertir)
    function isDocumentStored(bytes32 _hash) external view returns (bool) {
        return documents[_hash].signer != address(0);
    }

    // 5. Contar documentos
    function getDocumentCount() external view returns (uint256) {
        return documentHashes.length;
    }

    // 6. Obtener hash por índice
    function getDocumentHashByIndex(uint256 _index) external view returns (bytes32) {
        require(_index < documentHashes.length, "Index out of bounds");
        return documentHashes[_index];
    }
}
```

> **¿Por qué no hay `bool exists` ni `mapping hashExists`?**
> Verificar `documents[hash].signer != address(0)` es equivalente y ahorra ~39% de gas en storage. `address(0)` nunca puede ser firmante válido.

---

### 1.2 Tests del contrato

**Archivo:** `sc/test/DocumentRegistry.t.sol`

La IA debe implementar exactamente estos 11 tests. Todos deben pasar con `forge test -vv`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/DocumentRegistry.sol";

contract DocumentRegistryTest is Test {
    DocumentRegistry public registry;
    
    address signer = address(0x1);
    bytes32 testHash = keccak256("test-document");
    bytes testSignature = hex"1234567890abcdef";
    uint256 testTimestamp = 1700000000;

    function setUp() public {
        registry = new DocumentRegistry();
    }

    function test_StoreDocument() public { /* almacena y verifica guardado */ }
    function test_VerifyDocument() public { /* verifica documento existente con firma válida */ }
    function test_RejectDuplicate() public { /* mismo hash dos veces debe revertir */ }
    function test_GetDocumentInfo() public { /* retorna struct correcta */ }
    function test_GetDocumentCount() public { /* retorna número correcto */ }
    function test_GetDocumentByIndex() public { /* retorna hash correcto por índice */ }
    function test_IsDocumentStored_True() public { /* documento almacenado → true */ }
    function test_IsDocumentStored_False() public { /* hash inexistente → false */ }
    function test_RejectNonExistentVerify() public { /* verifyDocument en hash no existente revierte */ }
    function test_MultipleDocuments() public { /* múltiples documentos, verificar count */ }
    function test_EventEmission() public { /* verificar evento DocumentStored emitido */ }
}
```

**Comando de validación:**
```bash
cd sc
forge test -vv
# Resultado esperado: 11/11 tests passing ✅

forge coverage
# Resultado esperado: >80% cobertura ✅
```

---

### 1.3 Script de despliegue

**Archivo:** `sc/script/Deploy.s.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/DocumentRegistry.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        DocumentRegistry registry = new DocumentRegistry();
        console.log("DocumentRegistry deployed at:", address(registry));
        vm.stopBroadcast();
    }
}
```

**Comando de despliegue** (ejecutar con Anvil corriendo en Terminal 1):
```bash
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

> ⚠️ La private key es la cuenta `[0]` de Anvil. **Solo para desarrollo local. NUNCA en mainnet.**

Después de desplegar, copiar la dirección impresa en consola y actualizar `NEXT_PUBLIC_CONTRACT_ADDRESS` en `dapp/.env.local`.

---

### 1.4 Export del ABI

Después de `forge build`, el ABI se genera en:
```
sc/out/DocumentRegistry.sol/DocumentRegistry.json
```

Copiar el array `abi` de ese archivo a `dapp/lib/abi.ts`:

```typescript
// dapp/lib/abi.ts
export const ABI = [
  // ← pegar aquí el array ABI completo generado por Foundry
] as const
```

> Sin ABI correcto, Ethers.js no puede codificar/decodificar llamadas al contrato.

---

## 💻 Fase 2: Frontend dApp

> **Objetivo:** Construir la interfaz web que se conecta al contrato desplegado.

### 2.1 Instalación de dependencias

```bash
cd dapp
npm install ethers@^6.0.0 next@14 react@18 react-dom@18 typescript tailwindcss lucide-react
npm install -D @types/react @types/node
```

---

### 2.2 Variables de entorno

**Archivo:** `dapp/.env.local`

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_MNEMONIC="test test test test test test test test test test test junk"
```

> La dirección del contrato se actualiza después de ejecutar el deploy de la Fase 1.

---

### 2.3 Context Provider de Wallets

**Archivo:** `dapp/contexts/MetaMaskContext.tsx`

Este contexto **reemplaza MetaMask por completo**. Deriva las 10 wallets de Anvil desde el mnemonic.

```typescript
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
```

---

### 2.4 Hook useContract

**Archivo:** `dapp/hooks/useContract.ts`

Centraliza todas las interacciones con el smart contract.

```typescript
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
```

---

### 2.5 Componente FileUploader

**Archivo:** `dapp/components/FileUploader.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

interface FileUploaderProps {
  onHashCalculated: (hash: string) => void
  disabled?: boolean
}

export function FileUploader({ onHashCalculated, disabled }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setFileName(file.name)

    // ✅ Calcular hash keccak256 del contenido binario del archivo
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const fileHash = ethers.keccak256(bytes)  // retorna '0x...'

    setHash(fileHash)
    onHashCalculated(fileHash)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={disabled || loading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0 file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {fileName && <p className="text-sm text-gray-600">Archivo: <strong>{fileName}</strong></p>}
      {hash && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-mono break-all">Hash: {hash}</p>
        </div>
      )}
    </div>
  )
}
```

---

### 2.6 Componente DocumentSigner

**Archivo:** `dapp/components/DocumentSigner.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { useMetaMask } from '@/contexts/MetaMaskContext'
import { useContract } from '@/hooks/useContract'
import { FileUploader } from './FileUploader'

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
    return <p className="text-gray-500">Conecta tu wallet para firmar documentos.</p>
  }

  return (
    <div className="space-y-6">
      <FileUploader onHashCalculated={setDocumentHash} disabled={loading} />

      {documentHash && !signature && (
        <button
          onClick={handleSign}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Firmando...' : '✍️ Sign Document'}
        </button>
      )}

      {signature && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Firma generada:</label>
          <textarea
            readOnly
            value={signature}
            rows={3}
            className="w-full p-2 text-xs font-mono bg-gray-50 border rounded-lg"
          />
          <button
            onClick={handleStore}
            disabled={loading || !!txHash}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Almacenando...' : txHash ? '✅ Almacenado' : '⛓️ Store on Blockchain'}
          </button>
        </div>
      )}

      {txHash && (
        <p className="text-xs text-gray-500 font-mono break-all">Tx: {txHash}</p>
      )}
    </div>
  )
}
```

---

### 2.7 Componente DocumentVerifier

**Archivo:** `dapp/components/DocumentVerifier.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { useContract } from '@/hooks/useContract'
import { FileUploader } from './FileUploader'

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
    valid: { label: '✅ VÁLIDO — Documento auténtico y firmante correcto', color: 'text-green-700 bg-green-50 border-green-200' },
    invalid: { label: '❌ INVÁLIDO — El firmante no coincide', color: 'text-red-700 bg-red-50 border-red-200' },
    'not-found': { label: '⚠️ No encontrado — Este documento no está registrado', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  }

  return (
    <div className="space-y-6">
      <FileUploader onHashCalculated={setFileHash} disabled={loading} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección del firmante</label>
        <input
          type="text"
          placeholder="0x..."
          value={signerInput}
          onChange={e => setSignerInput(e.target.value)}
          className="w-full p-2 border rounded-lg font-mono text-sm"
        />
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || !fileHash || !signerInput}
        className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Verificando...' : '🔍 Verify Document'}
      </button>

      {result && (
        <div className={`p-4 border rounded-lg font-semibold ${resultUI[result].color}`}>
          {resultUI[result].label}
        </div>
      )}
    </div>
  )
}
```

---

### 2.8 Componente DocumentHistory

**Archivo:** `dapp/components/DocumentHistory.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useContract } from '@/hooks/useContract'

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
        onClick={loadHistory}
        disabled={loading}
        className="py-2 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? 'Cargando...' : '🔄 Cargar historial'}
      </button>

      {docs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left border">Hash</th>
                <th className="p-2 text-left border">Firmante</th>
                <th className="p-2 text-left border">Fecha</th>
                <th className="p-2 text-left border">Firma</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-2 border font-mono text-xs">{truncate(doc.hash)}</td>
                  <td className="p-2 border font-mono text-xs">{doc.signer}</td>
                  {/* ✅ Convertir bigint timestamp a Date */}
                  <td className="p-2 border text-xs">
                    {new Date(Number(doc.timestamp) * 1000).toLocaleString()}
                  </td>
                  <td className="p-2 border font-mono text-xs">{truncate(doc.signature, 20, 6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {docs.length === 0 && !loading && (
        <p className="text-gray-400 text-sm">Sin documentos. Carga el historial para verlos.</p>
      )}
    </div>
  )
}
```

---

### 2.9 Página principal

**Archivo:** `dapp/app/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useMetaMask } from '@/contexts/MetaMaskContext'
import { DocumentSigner } from '@/components/DocumentSigner'
import { DocumentVerifier } from '@/components/DocumentVerifier'
import { DocumentHistory } from '@/components/DocumentHistory'

type Tab = 'upload' | 'verify' | 'history'

const tabs = [
  { id: 'upload' as Tab, label: '📄 Upload & Sign' },
  { id: 'verify' as Tab, label: '✅ Verify' },
  { id: 'history' as Tab, label: '📋 History' },
]

export default function Home() {
  const { isConnected, currentWallet, availableWallets, connect, disconnect, switchWallet } = useMetaMask()
  const [activeTab, setActiveTab] = useState<Tab>('upload')

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">⛓️ DocChain</h1>
          <div className="flex items-center gap-3">
            {isConnected && currentWallet ? (
              <>
                {/* Selector de wallet */}
                <select
                  onChange={e => switchWallet(Number(e.target.value))}
                  value={currentWallet.index}
                  className="text-sm border rounded-lg p-1"
                >
                  {availableWallets.map(w => (
                    <option key={w.index} value={w.index}>
                      Wallet {w.index}: {w.address.slice(0, 6)}...{w.address.slice(-4)}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-green-600 font-medium">● Conectado</span>
                <button onClick={disconnect} className="text-sm text-red-500 hover:text-red-700">
                  Desconectar
                </button>
              </>
            ) : (
              <button
                onClick={() => connect(0)}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Conectar Wallet
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido del tab */}
        <div className="bg-white border rounded-xl p-6">
          {activeTab === 'upload' && <DocumentSigner />}
          {activeTab === 'verify' && <DocumentVerifier />}
          {activeTab === 'history' && <DocumentHistory />}
        </div>

      </div>
    </main>
  )
}
```

---

## 🔗 Fase 3: Integración

> Conectar todo y verificar que funciona de extremo a extremo.

### 3.1 Secuencia de inicialización

Abrir 3 terminales separadas y ejecutar en orden:

```bash
# ── Terminal 1: Nodo Ethereum local ───────────────────────────────
anvil
# Dejar corriendo. Imprime 10 cuentas con sus private keys.

# ── Terminal 2: Desplegar contrato ────────────────────────────────
cd sc
forge build
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Copiar la dirección impresa: "DocumentRegistry deployed at: 0x..."
# Actualizar dapp/.env.local:
# NEXT_PUBLIC_CONTRACT_ADDRESS=0x<dirección-copiada>

# ── Terminal 3: Frontend ───────────────────────────────────────────
cd dapp
npm run dev
# Abrir http://localhost:3000
```

### 3.2 ABI: del contrato al frontend

```bash
# Después de forge build, ejecutar en sc/
cat out/DocumentRegistry.sol/DocumentRegistry.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(json.dumps(data['abi'], indent=2))
"
# Copiar el output a dapp/lib/abi.ts
```

---

## 🧪 Fase 4: Testing

### 4.1 Tests del smart contract

```bash
cd sc
forge test -vv        # 11/11 tests deben pasar
forge coverage        # Cobertura debe ser >80%
```

### 4.2 Flujo de prueba manual (Happy Path)

Ejecutar en este orden exacto desde el navegador:

1. **Conectar Wallet**
   - Abrir `http://localhost:3000`
   - Click en "Conectar Wallet" → selecciona Wallet 0

2. **Firmar Documento**
   - Tab "Upload & Sign" → subir cualquier archivo
   - Click "Sign Document" → confirmar alert
   - Verificar que aparece la firma en el textarea

3. **Almacenar en Blockchain**
   - Click "Store on Blockchain" → confirmar alert
   - Verificar que aparece el `tx hash`

4. **Verificar Documento**
   - Tab "Verify" → subir **el mismo archivo**
   - Pegar la dirección de Wallet 0
   - Click "Verify Document"
   - Resultado esperado: `✅ VÁLIDO`

5. **Ver Historial**
   - Tab "History" → click "Cargar historial"
   - El documento debe aparecer en la tabla

### 4.3 Escenarios de error (deben comportarse correctamente)

| Escenario | Pasos | Resultado esperado |
|---|---|---|
| Documento duplicado | Almacenar el mismo archivo dos veces | Error: `Document already exists` |
| Firmante incorrecto | Almacenar con Wallet 0, verificar con Wallet 1 | `❌ INVÁLIDO` |
| Documento no existente | Verificar archivo nunca almacenado | `⚠️ No encontrado` |
| Cambio de wallet | Firmar con W0, cambiar a W1, firmar otro | Ambos en historial con firmantes distintos |

---

## ⚠️ Errores comunes — La IA debe evitar estos

| Error | Causa | Solución |
|---|---|---|
| `ethers.Wallet.fromMnemonic is not a function` | API de Ethers.js v5 | Usar `ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path)` |
| `Cannot convert BigInt to number` | bigint de Solidity sin convertir | Usar `Number(bigint)` o `bigint.toString()` |
| `Document already exists` (tx revertida) | Hash ya registrado | Verificar con `isDocumentStored()` antes de almacenar |
| `Document does not exist` (call revertida) | `getDocumentInfo()` en hash no registrado | Siempre llamar `isDocumentStored()` primero |
| Hydration error en Next.js | Wallets derivadas en SSR, difieren del cliente | Derivar wallets dentro de `useEffect`, nunca en render inicial |
| CORS al conectar con Anvil | Provider creado en Server Component | El `JsonRpcProvider` debe crearse solo en el cliente (`'use client'`) |
| Firma inválida al verificar | Comparación case-sensitive de addresses | Usar `.toLowerCase()` en ambos lados al comparar |
| `parseInt()` con BigInt falla | `parseInt` no acepta BigInt | Usar `Number(bigint)` o `bigint.toString()` |

---

## ✅ Checklist de entrega

### Smart Contracts
- [ ] `DocumentRegistry.sol` compila sin errores (`forge build`)
- [ ] Struct `Document` sin campo `exists` redundante
- [ ] Sin mapping `hashExists` redundante
- [ ] 11/11 tests pasando (`forge test -vv`)
- [ ] Cobertura >80% (`forge coverage`)
- [ ] Script `Deploy.s.sol` funcional y desplegado en Anvil
- [ ] ABI exportado a `dapp/lib/abi.ts`

### Frontend
- [ ] `MetaMaskContext.tsx` con derivación de wallets desde mnemonic (Ethers.js v6)
- [ ] `useContract.ts` con las 6 funciones del contrato
- [ ] `FileUploader.tsx` calcula hash keccak256 correctamente
- [ ] `DocumentSigner.tsx` muestra confirmaciones y firma con `ethers.getBytes()`
- [ ] `DocumentVerifier.tsx` compara addresses en lowercase
- [ ] `DocumentHistory.tsx` convierte timestamps bigint a `Date`
- [ ] `page.tsx` con 3 tabs y selector de wallet funcional
- [ ] `.env.local` con las 4 variables configuradas
- [ ] Sin uso de `ethers.Wallet.fromMnemonic` (API v5)

### Integración
- [ ] Frontend conecta al contrato desplegado en Anvil
- [ ] Happy path completo: Upload → Sign → Store → Verify ✅
- [ ] Errores manejados y visibles en UI
- [ ] Historial muestra documentos correctamente
- [ ] `README.md` con instrucciones de instalación y uso
- [ ] `.gitignore` configurado (`node_modules/`, `.env.local`, `out/`, `cache/`)
