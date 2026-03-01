// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/DocumentRegistry.sol";

contract DocumentRegistryTest is Test {
    DocumentRegistry public registry;

    // Redeclare events for vm.expectEmit (Solidity 0.8.19 compatibility)
    event DocumentStored(
        bytes32 indexed hash,
        address indexed signer,
        uint256 timestamp
    );

    address signer = address(0x1);
    bytes32 testHash = keccak256("test-document");
    bytes testSignature = hex"1234567890abcdef";
    uint256 testTimestamp = 1700000000;

    function setUp() public {
        registry = new DocumentRegistry();
    }

    /// @dev Almacena un documento y verifica que fue guardado correctamente
    function test_StoreDocument() public {
        registry.storeDocumentHash(
            testHash,
            testTimestamp,
            testSignature,
            signer
        );

        DocumentRegistry.Document memory doc = registry.getDocumentInfo(
            testHash
        );
        assertEq(doc.hash, testHash);
        assertEq(doc.timestamp, testTimestamp);
        assertEq(doc.signer, signer);
        assertEq(doc.signature, testSignature);
    }

    /// @dev Verifica documento existente con firma válida
    function test_VerifyDocument() public {
        registry.storeDocumentHash(
            testHash,
            testTimestamp,
            testSignature,
            signer
        );

        bool isValid = registry.verifyDocument(testHash, signer, testSignature);
        assertTrue(isValid);
    }

    /// @dev Mismo hash dos veces debe revertir
    function test_RejectDuplicate() public {
        registry.storeDocumentHash(
            testHash,
            testTimestamp,
            testSignature,
            signer
        );

        vm.expectRevert("Document already exists");
        registry.storeDocumentHash(
            testHash,
            testTimestamp,
            testSignature,
            signer
        );
    }

    /// @dev Retorna struct correcta
    function test_GetDocumentInfo() public {
        registry.storeDocumentHash(
            testHash,
            testTimestamp,
            testSignature,
            signer
        );

        DocumentRegistry.Document memory doc = registry.getDocumentInfo(
            testHash
        );
        assertEq(doc.hash, testHash);
        assertEq(doc.signer, signer);
        assertEq(doc.timestamp, testTimestamp);
        assertEq(doc.signature, testSignature);
    }

    /// @dev Retorna número correcto de documentos
    function test_GetDocumentCount() public {
        assertEq(registry.getDocumentCount(), 0);

        registry.storeDocumentHash(
            testHash,
            testTimestamp,
            testSignature,
            signer
        );
        assertEq(registry.getDocumentCount(), 1);
    }

    /// @dev Retorna hash correcto por índice
    function test_GetDocumentByIndex() public {
        registry.storeDocumentHash(
            testHash,
            testTimestamp,
            testSignature,
            signer
        );

        bytes32 storedHash = registry.getDocumentHashByIndex(0);
        assertEq(storedHash, testHash);
    }

    /// @dev Documento almacenado retorna true
    function test_IsDocumentStored_True() public {
        registry.storeDocumentHash(
            testHash,
            testTimestamp,
            testSignature,
            signer
        );

        assertTrue(registry.isDocumentStored(testHash));
    }

    /// @dev Hash inexistente retorna false
    function test_IsDocumentStored_False() public view {
        bytes32 fakeHash = keccak256("non-existent");
        assertFalse(registry.isDocumentStored(fakeHash));
    }

    /// @dev verifyDocument en hash no existente revierte
    function test_RejectNonExistentVerify() public {
        bytes32 fakeHash = keccak256("non-existent");

        vm.expectRevert("Document does not exist");
        registry.verifyDocument(fakeHash, signer, testSignature);
    }

    /// @dev Múltiples documentos, verificar count
    function test_MultipleDocuments() public {
        bytes32 hash1 = keccak256("doc-1");
        bytes32 hash2 = keccak256("doc-2");
        bytes32 hash3 = keccak256("doc-3");

        registry.storeDocumentHash(hash1, testTimestamp, testSignature, signer);
        registry.storeDocumentHash(
            hash2,
            testTimestamp + 1,
            testSignature,
            signer
        );
        registry.storeDocumentHash(
            hash3,
            testTimestamp + 2,
            testSignature,
            address(0x2)
        );

        assertEq(registry.getDocumentCount(), 3);
        assertEq(registry.getDocumentHashByIndex(0), hash1);
        assertEq(registry.getDocumentHashByIndex(1), hash2);
        assertEq(registry.getDocumentHashByIndex(2), hash3);
    }

    /// @dev Verificar evento DocumentStored emitido
    function test_EventEmission() public {
        vm.expectEmit(true, true, false, true);
        emit DocumentStored(testHash, signer, testTimestamp);

        registry.storeDocumentHash(
            testHash,
            testTimestamp,
            testSignature,
            signer
        );
    }
}
