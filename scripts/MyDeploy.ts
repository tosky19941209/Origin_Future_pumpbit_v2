import { ethers, hardhatArguments } from "hardhat";
import { networks } from "./networks";
import { getContractAddress, getCreate2Address } from "@ethersproject/address";
import { keccak256 } from "@ethersproject/keccak256";
import { encodePacked } from "web3-utils";

async function main() {
    const network = networks[hardhatArguments.network as keyof typeof networks];
    if (network == undefined) {
        throw new Error(`network ${hardhatArguments.network} is not defined`);
    }

    const routerAddr = "0xB7D989FA95988eF5fA9FD5cca3E3355D57D7cB17"
    const marketManagerAddr = "0x2c9Cd717C31e0f7D0c5a6852120a42Fe039Ab8Fc"
    const OrderBook = await ethers.getContractFactory("OrderBook");
    const orderBook = await OrderBook.deploy(
        network.usd,
        routerAddr,
        marketManagerAddr,
        network.minOrderBookExecutionFee,
    );
    await orderBook.waitForDeployment();
    console.log(`OrderBook deployed to: ${await orderBook.getAddress()}`);
}

main()