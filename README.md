# ⛓️ DocChain — Verificación de Documentos en Blockchain

> Almacena y verifica la autenticidad de documentos usando Ethereum. Sin servidores centrales. Sin MetaMask. Solo criptografía.

![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?logo=solidity)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0)
![Foundry](https://img.shields.io/badge/Foundry-Anvil-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ¿Qué es DocChain?

DocChain es una aplicación descentralizada (dApp) que permite a cualquier persona **demostrar que un documento existía en un momento específico y que fue firmado por una dirección Ethereum concreta**, sin necesidad de confiar en ningún intermediario.

El flujo es simple:

```
Tú subes un archivo  →  Se calcula su huella (hash)  →  Firmas la huella  →  La huella vive en blockchain para siempre
```

Cualquiera puede verificar después: si el hash del archivo coincide con el registrado en la blockchain, y el firmante coincide, el documento es **auténtico e inalterado**.

### Lo que DocChain *no* hace

- ❌ **No almacena tus archivos** en ningún lugar (ni blockchain, ni IPFS, ni servidores)
- ❌ **No requiere MetaMask** ni ninguna extensión de navegador
- ❌ **No tiene backend** — todo es contrato inteligente + frontend estático

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                              │
│              sube archivo → ve resultado                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                 FRONTEND (Next.js 14)                       │
│                                                             │
│  FileUploader    →   keccak256(archivo) = hash              │
│  DocumentSigner  →   wallet.signMessage(hash) = firma       │
│  DocumentVerifier→   hash + firmante → ¿válido?             │
│  DocumentHistory →   lista todos los documentos             │
│                                                             │
│  Sin MetaMask: wallets derivadas desde mnemonic de Anvil    │
│  JsonRpcProvider conectado a http://localhost:8545          │
└───────────────────────┬─────────────────────────────────────┘
                        │  Ethers.js v6
┌───────────────────────▼─────────────────────────────────────┐
│            SMART CONTRACT (Solidity 0.8.19)                 │
│                  DocumentRegistry.sol                       │
│                                                             │
│  storeDocumentHash()   →  guarda hash + firma + timestamp   │
│  verifyDocument()      →  verifica autenticidad             │
│  getDocumentInfo()     →  retorna datos del documento       │
│  isDocumentStored()    →  comprueba existencia              │
│  getDocumentCount()    →  total de documentos               │
│  getDocumentHashByIndex() →  itera el historial             │
│                                                             │
│  Red: Anvil (local) / Ethereum (mainnet/testnet)            │
└─────────────────────────────────────────────────────────────┘
```

### Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Smart Contracts | Solidity + Foundry | `^0.8.19` |
| Framework Frontend | Next.js + TypeScript | `14+` |
| Estilos | Tailwind CSS | `3+` |
| Librería Web3 | Ethers.js | `v6` |
| Nodo local Ethereum | Anvil (Foundry toolkit) | latest |

---

## Estructura del proyecto

```
docchain/
├── sc/                              ← Smart Contracts (Foundry)
│   ├── src/
│   │   └── DocumentRegistry.sol    ← Contrato principal
│   ├── test/
│   │   └── DocumentRegistry.t.sol  ← 11 tests (Forge)
│   ├── script/
│   │   └── Deploy.s.sol            ← Script de despliegue
│   └── foundry.toml
│
├── dapp/                            ← Frontend (Next.js)
│   ├── app/
│   │   └── page.tsx                ← Página principal con tabs
│   ├── components/
│   │   ├── FileUploader.tsx        ← Cálculo de hash keccak256
│   │   ├── DocumentSigner.tsx      ← Firma y almacenamiento
│   │   ├── DocumentVerifier.tsx    ← Verificación de autenticidad
│   │   └── DocumentHistory.tsx     ← Historial de documentos
│   ├── contexts/
│   │   └── MetaMaskContext.tsx     ← Wallets sin MetaMask
│   ├── hooks/
│   │   └── useContract.ts          ← Interacción con el contrato
│   ├── lib/
│   │   └── abi.ts                  ← ABI del contrato
│   └── .env.local                  ← Variables de entorno
│
└── README.md
```

---

## Requisitos previos

Instalar estas herramientas antes de continuar:

**Foundry** (Forge + Anvil + Cast):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

**Node.js** (v18 o superior):
```bash
node --version   # debe ser v18+
```

Verificar que todo está instalado:
```bash
forge --version
anvil --version
node --version
```

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/docchain.git
cd docchain
```

### 2. Instalar dependencias del smart contract

```bash
cd sc
forge install
```

### 3. Instalar dependencias del frontend

```bash
cd dapp
npm install
```

### 4. Configurar variables de entorno

Crear el archivo `dapp/.env.local` con este contenido:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=    # se completa después del deploy
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_MNEMONIC="test test test test test test test test test test test junk"
```

> El mnemonic es el estándar de Anvil. Solo usar en desarrollo local.

---

## Ejecución en desarrollo

Se necesitan **3 terminales** abiertas en paralelo.

### Terminal 1 — Iniciar el nodo Ethereum local

```bash
anvil
```

Anvil arranca e imprime 10 cuentas con sus private keys y ETH de prueba. Dejar corriendo durante todo el desarrollo.

```
                             _   _
                            (_) | |
      __ _   _ __   __   __  _  | |
     / _` | | '_ \  \ \ / / | | | |
    | (_| | | | | |  \ V /  | | | |
     \__,_| |_| |_|   \_/   |_| |_|

    0.2.x (...)

Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...
```

### Terminal 2 — Compilar y desplegar el contrato

```bash
cd sc

# Compilar
forge build

# Desplegar en Anvil
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

La consola imprimirá algo como:
```
DocumentRegistry deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**Copiar esa dirección** y actualizar `dapp/.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

#### Exportar el ABI al frontend

```bash
# Desde la carpeta sc/
cat out/DocumentRegistry.sol/DocumentRegistry.json \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d['abi'], indent=2))"
```

Pegar el output en `dapp/lib/abi.ts`:

```typescript
export const ABI = [
  // ... pegar aquí el array ABI
] as const
```

### Terminal 3 — Iniciar el frontend

```bash
cd dapp
npm run dev
```

Abrir **http://localhost:3000** en el navegador.

---

## Uso

### 1. Conectar una wallet

Al abrir la app, hacer click en **"Conectar Wallet"**. El dropdown muestra las 10 cuentas de Anvil, cada una con 10,000 ETH de prueba. Seleccionar **Wallet 0** para empezar.

### 2. Firmar un documento

1. Ir al tab **📄 Upload & Sign**
2. Seleccionar cualquier archivo (PDF, imagen, Word, lo que sea)
3. La app calcula el hash `keccak256` del archivo automáticamente
4. Hacer click en **"Sign Document"** — confirmar en el diálogo
5. La firma criptográfica aparece en pantalla

### 3. Almacenar en blockchain

1. Con el documento firmado, hacer click en **"Store on Blockchain"**
2. Confirmar en el diálogo de advertencia
3. La transacción se envía a Anvil — aparece el `tx hash` de confirmación

> El documento ahora existe permanentemente en la blockchain local. Nadie puede modificarlo ni borrarlo.

### 4. Verificar un documento

1. Ir al tab **✅ Verify**
2. Subir el **mismo archivo** que se almacenó
3. Pegar la dirección Ethereum del firmante original
4. Hacer click en **"Verify Document"**

Resultados posibles:
- `✅ VÁLIDO` — el archivo es auténtico y el firmante coincide
- `❌ INVÁLIDO` — el archivo existe en blockchain pero el firmante no coincide
- `⚠️ No encontrado` — este archivo nunca fue registrado

### 5. Ver el historial

1. Ir al tab **📋 History**
2. Hacer click en **"Cargar historial"**
3. Se muestra una tabla con todos los documentos registrados: hash, firmante, fecha y firma

---

## Testing

### Tests del smart contract

```bash
cd sc

# Ejecutar los 11 tests
forge test -vv

# Ver cobertura de código
forge coverage
```

Resultado esperado:
```
Running 11 tests for test/DocumentRegistry.t.sol:DocumentRegistryTest
[PASS] test_EventEmission()
[PASS] test_GetDocumentByIndex()
[PASS] test_GetDocumentCount()
[PASS] test_GetDocumentInfo()
[PASS] test_IsDocumentStored_False()
[PASS] test_IsDocumentStored_True()
[PASS] test_MultipleDocuments()
[PASS] test_RejectDuplicate()
[PASS] test_RejectNonExistentVerify()
[PASS] test_StoreDocument()
[PASS] test_VerifyDocument()

Test result: ok. 11 passed; 0 failed ✅
```

### Escenarios de prueba manual

| Escenario | Pasos | Resultado esperado |
|---|---|---|
| **Happy path** | Subir → Firmar → Almacenar → Verificar | `✅ VÁLIDO` |
| **Duplicado** | Intentar almacenar el mismo archivo dos veces | Error: `Document already exists` |
| **Firmante incorrecto** | Almacenar con Wallet 0, verificar con dirección de Wallet 1 | `❌ INVÁLIDO` |
| **No registrado** | Verificar un archivo que nunca fue almacenado | `⚠️ No encontrado` |
| **Multi-wallet** | Firmar con Wallet 0, cambiar a Wallet 1, firmar otro archivo | Ambos en historial con firmantes distintos |

---

## Cómo funciona por dentro

### El hash como huella digital

Cuando subes un archivo, DocChain calcula su hash `keccak256`:

```typescript
const buffer = await file.arrayBuffer()
const bytes  = new Uint8Array(buffer)
const hash   = ethers.keccak256(bytes)  // → "0xabc123..."
```

El hash es determinístico: el mismo archivo **siempre** produce el mismo hash. Si el archivo cambia un solo bit, el hash es completamente diferente.

### La firma criptográfica

La firma se realiza sobre los bytes del hash, no sobre el string:

```typescript
// ✅ Correcto: firma sobre bytes raw
const signature = await wallet.signMessage(ethers.getBytes(hash))
```

Esto es consistente con cómo el contrato verifica con `ecrecover`.

### El contrato optimizado

El struct `Document` no incluye un campo `bool exists` porque es redundante. Se verifica existencia así:

```solidity
// Si signer es address(0), el documento no existe
// address(0) nunca puede ser firmante válido → 0 ambigüedad
documents[hash].signer != address(0)
```

Esto ahorra ~39% de gas en operaciones de almacenamiento.

### Wallets sin MetaMask

Las wallets se derivan del mnemonic estándar de Anvil usando la ruta BIP-44:

```typescript
// Ethers.js v6 — NOT Wallet.fromMnemonic (eso es v5)
const wallet = ethers.HDNodeWallet.fromPhrase(
  mnemonic,
  undefined,
  `m/44'/60'/0'/0/${index}`
)
```

Esto permite desarrollar sin instalar extensiones de navegador.

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Dirección del contrato desplegado | `0x9fE467...` |
| `NEXT_PUBLIC_RPC_URL` | URL del nodo Ethereum | `http://localhost:8545` |
| `NEXT_PUBLIC_CHAIN_ID` | ID de la red (31337 = Anvil local) | `31337` |
| `NEXT_PUBLIC_MNEMONIC` | Mnemonic para derivar wallets | `"test test ... junk"` |

> ⚠️ Nunca subas `.env.local` a Git. Está incluido en `.gitignore`.

---

## Despliegue en testnet

Para desplegar en una testnet pública (ej. Sepolia):

```bash
# 1. Obtener ETH de testnet desde un faucet
# 2. Configurar RPC (ej. desde Alchemy o Infura)

forge script script/Deploy.s.sol \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY \
  --broadcast \
  --private-key TU_PRIVATE_KEY_REAL
```

Actualizar `dapp/.env.local` con la nueva dirección y el RPC de Sepolia.

> ⚠️ Nunca uses la private key de Anvil (`0xac0974...`) en mainnet o testnet con fondos reales.

---

## .gitignore recomendado

```gitignore
# Frontend
dapp/node_modules/
dapp/.env.local
dapp/.next/

# Foundry
sc/out/
sc/cache/
sc/broadcast/

# Sistema
.DS_Store
*.log
```

---

## Licencia

MIT — libre para usar, modificar y distribuir.

---

<div align="center">
  <sub>Construido con Solidity, Next.js y Ethers.js v6</sub>
</div>
