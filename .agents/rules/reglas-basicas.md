---
trigger: always_on
---

Este documento detalla los estándares y convención de desarrollo para asegurar la calidad y consistencia del código.

## 1. Control de Versiones (Git)
- **Commits:** Sigue la convención [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
- **Ramas:** Usa `feature/`, `fix/`, `hotfix/`. Evita subir cambios directos a `main`/`master`.
- **Pull Requests:** Todo cambio debe pasar por un PR y revisión de pares (Code Review).

## 2. Estilo de Código
- **Lenguaje:** Usa el estilo estándar del lenguaje (ej. [Prettier](https://prettier.io/) para JS/TS, [PEP 8](https://pep8.org/) para Python).
- **Formato:** Mantén los archivos con sangría de 2/4 espacios y codificación UTF-8.

## 3. Estructura de Proyecto
- Mantén los componentes pequeños y reutilizables.
- Sigue el principio de responsabilidad única (Single Responsibility Principle).

## 4. Documentación
- Actualiza el `README.md` con cambios en la instalación o uso.
- Documenta funciones complejas usando JSDoc/Docstrings.

## 5. Pruebas (Testing)
- **Cobertura:** Todo nuevo feature debe incluir tests unitarios.
- **Ejecución:** Corre `npm test` o `pytest` antes de enviar el PR.

## 6. En la planificacion crear architecture diagrams y user flows.

Notas para Blockchain: 
Implementar límites de tamaño de archivo
Usar solo en Anvil local - No desplegar en redes públicas con claves hardcodeadas
Verificar firmas antes de almacenar usando ethers.verifyMessage()
Validar conexión a Anvil antes de operaciones
Confirmar operaciones con alerts de confirmación
Manejar errores de red apropiadamente
Usar Ethers.js v6 para todas las operaciones criptográficas
Validar hashes generados por Ethers.js
Logging detallado con emojis para debugging
Siempre `uint256` para IDs, evita `address(0)` checks redundantes.
Emite eventos para todos los state changes.
Genera tests con Foundry antes del contrato.
Combina tipado fuerte con hooks reutilizables para UIs Web3.
Desarrollar dividiendo tareas en chunks: contracts → types → UI → tests.