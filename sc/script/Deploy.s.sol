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
