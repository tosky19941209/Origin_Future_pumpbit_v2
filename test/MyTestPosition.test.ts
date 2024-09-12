import { loadFixture, mine, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { SIDE_LONG, SIDE_SHORT } from "./shared/Constants";

describe("PositionRouter", function () {
    const defaultMinExecutionFee = 3000;

    async function deployFixture() {
        const [owner, otherAccount1, otherAccount2] = await ethers.getSigners();
        const ERC20Test = await ethers.getContractFactory("ERC20Test");
        const USD = await ERC20Test.connect(otherAccount1).deploy("USD", "USD", 6, 100_000_000n);
        const BTC = await ERC20Test.connect(otherAccount1).deploy("Bitcoin", "BTC", 18, 100_000_000);
        const ETH = await ERC20Test.connect(otherAccount1).deploy("ETHER", "ETH", 18, 100_000_000);
        await USD.waitForDeployment();
        await BTC.waitForDeployment();
        await ETH.waitForDeployment();

        const Router = await ethers.getContractFactory("Router");
        const router = await Router.deploy(USD.target, ETH.target)
        await router.waitForDeployment();

        const GasRouter = await ethers.getContractFactory("GasDrainingMockRouter");
        const gasRouter = await GasRouter.deploy();
        await gasRouter.waitForDeployment();

        const marketManager = await ethers.deployContract("MockMarketManager");

        // router can transfer owner's USD
        await USD.connect(otherAccount1).approve(router.target, 100_000_000n);
        await USD.connect(otherAccount1).approve(gasRouter.target, 100_000_000n);

        const PositionRouter = await ethers.getContractFactory("PositionRouter");
        const positionRouter = await PositionRouter.deploy(
            USD.target,
            router.target,
            marketManager.target,
            defaultMinExecutionFee,
        );
        await positionRouter.waitForDeployment();

        const positionRouterWithBadRouter = await PositionRouter.deploy(
            USD.target,
            gasRouter.target,
            marketManager.target,
            defaultMinExecutionFee,
        );
        await positionRouterWithBadRouter.waitForDeployment();

        const RevertedFeeReceiver = await ethers.getContractFactory("RevertedFeeReceiver");
        const revertedFeeReceiver = await RevertedFeeReceiver.deploy();
        await revertedFeeReceiver.waitForDeployment();

        const marketDescriptorDeployer = await ethers.deployContract("MarketDescriptorDeployer");
        await marketDescriptorDeployer.waitForDeployment();
        await marketDescriptorDeployer.deploy(await ETH.symbol());
        const market = await marketDescriptorDeployer.descriptors(await ETH.symbol());
        await marketDescriptorDeployer.deploy(await BTC.symbol());
        const market2 = await marketDescriptorDeployer.descriptors(await BTC.symbol());

        return {
            owner,
            otherAccount1,
            otherAccount2,
            router,
            positionRouter,
            positionRouterWithBadRouter,
            USD,
            ETH,
            marketManager,
            market,
            market2,
            revertedFeeReceiver,
        };
    }

    describe("LiquidityCreate", async () => {
        it("LiquidityCreate ", async () => {
            const { owner, positionRouter, market, otherAccount1, otherAccount2, USD, router } = await loadFixture(deployFixture);
            console.log("OtherPerson1 balance =>", await USD.balanceOf(otherAccount1))
            console.log("OtherPerson2 balance =>", await USD.balanceOf(otherAccount2))
            console.log("Owner balance =>", await USD.balanceOf(owner))

            await router.connect(owner).registerPlugin(positionRouter.target)
            const approve123 = await router.connect(otherAccount1).approvePlugin(positionRouter.target);
            console.log("Reseult of Router =>>>>>", await router.isPluginApproved(otherAccount1, positionRouter.target))
            await positionRouter.connect(otherAccount1).createIncreaseLiquidityPosition(market, 100, 1000, 140, { value: 4000 })
            await positionRouter.connect(otherAccount1).createIncreaseLiquidityPosition(market, 110, 1100, 140, { value: 4000 })
            await positionRouter.connect(otherAccount1).createIncreaseLiquidityPosition(market, 120, 1200, 140, { value: 4000 })

            console.log("OtherPerson1 balance =>", await USD.balanceOf(otherAccount1))

            console.log("Pools =>", await positionRouter.connect(otherAccount1).increaseLiquidityPositionIndex())
            console.log("Pools =>", await positionRouter.connect(otherAccount1).increaseLiquidityPositionIndexNext())
            console.log("Pools =>", await positionRouter.connect(otherAccount1).increaseLiquidityPositionRequests(1))

            await positionRouter.connect(otherAccount1).cancelIncreaseLiquidityPosition(1, otherAccount1)


        })
    })




})