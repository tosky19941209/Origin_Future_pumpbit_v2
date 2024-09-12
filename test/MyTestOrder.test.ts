import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SIDE_LONG, SIDE_SHORT } from "./shared/Constants";

describe("OrderBook", function () {
    async function deployFixture() {
        const [owner, otherAccount1, otherAccount2] = await ethers.getSigners();
        const ERC20Test = await ethers.getContractFactory("ERC20Test");
        const USD = await ERC20Test.connect(otherAccount1).deploy("USD", "USD", 6, 100_000_000n);
        const ETH = await ERC20Test.connect(otherAccount1).deploy("ETH", "ETH", 18, 100_000_000n);
        await USD.waitForDeployment();
        await ETH.waitForDeployment();
        console.log("USD Target => ", USD.target)
        console.log("ETH Target => ", ETH.target)
        // const router = await ethers.deployContract("MockRouter");
        const Router = await ethers.getContractFactory("Router");
        const router = await Router.deploy(USD.target, ETH.target)
        await router.waitForDeployment();

        // a bad router that will drain the gas
        const gasRouter = await ethers.deployContract("GasDrainingMockRouter");
        await gasRouter.waitForDeployment();

        const marketManager = await ethers.deployContract("MockMarketManager");

        const OrderBook = await ethers.getContractFactory("OrderBook");
        const orderBook = await OrderBook.deploy(USD.target, router.target, marketManager.target, 400000000000000);
        await orderBook.waitForDeployment();

        const orderBookWithBadRouter = await OrderBook.deploy(USD.target, gasRouter.target, marketManager.target, 3000);

        await orderBookWithBadRouter.waitForDeployment();

        // await USD.connect(otherAccount1).approve(router.target, 100_000_000n);
        // await USD.connect(otherAccount1).approve(gasRouter.target, 100_000_000n);

        const RevertedFeeReceiver = await ethers.getContractFactory("RevertedFeeReceiver");
        const revertedFeeReceiver = await RevertedFeeReceiver.deploy();
        await revertedFeeReceiver.waitForDeployment();

        const marketDescriptorDeployer = await ethers.deployContract("MarketDescriptorDeployer");
        await marketDescriptorDeployer.waitForDeployment();
        await marketDescriptorDeployer.deploy(await ETH.symbol());
        const market = await marketDescriptorDeployer.descriptors(await ETH.symbol());

        return {
            orderBook,
            orderBookWithBadRouter,
            owner,
            otherAccount1,
            otherAccount2,
            USD,
            ETH,
            router,
            marketManager,
            market,
            revertedFeeReceiver,
        };
    }

    describe("#createIncreaseOrder", async () => {
        it("should revert if insufficient execution fee", async () => {
            const { orderBook, market, otherAccount1, USD, ETH, owner, router, otherAccount2 } = await loadFixture(deployFixture);

            console.log("OtherWallet1 => ", await USD.balanceOf(otherAccount1))
            console.log("OtherWallet2 => ", await USD.balanceOf(otherAccount2))
            console.log("Owner Addrss => ", await owner.address)

            await USD.connect(otherAccount1).approve(router.target, 1000000n)

            await router.connect(owner).registerPlugin(orderBook.target)
            // console.log("OKkkkkk")
            const approve123 = await router.connect(otherAccount1).approvePlugin(orderBook.target);

            // console.log("Reseult of Router =>>>>>", await router.isPluginApproved(otherAccount1, orderBook.target))

            await orderBook.connect(otherAccount1).createIncreaseOrder(market, SIDE_LONG, 300n, 1n, 1000n, true, 1100n, {
                value: 500000000000000,
            })

            console.log("OtherWallet1 => ", await USD.balanceOf(otherAccount1))
            console.log("OtherWallet2 => ", await USD.balanceOf(otherAccount2))

        });

        it("should canceled ordered if caller is executer", async () => {
            const { orderBook, market, otherAccount1, USD, ETH, owner, router, otherAccount2 } = await loadFixture(deployFixture);

            console.log("OtherWallet1 => ", await USD.balanceOf(otherAccount1))
            console.log("OtherWallet2 => ", await USD.balanceOf(otherAccount2))
            console.log("Owner Addrss => ", await owner.address)

            await USD.connect(otherAccount1).allowance(otherAccount1, router.target)
            await USD.connect(otherAccount1).approve(router.target, 1000000n)

            await router.connect(owner).registerPlugin(orderBook.target)
            // console.log("OKkkkkk")
            const approve123 = await router.connect(otherAccount1).approvePlugin(orderBook.target);

            console.log("Reseult of Router =>>>>>", await router.isPluginApproved(otherAccount1, orderBook.target))

            await orderBook.connect(otherAccount1).createIncreaseOrder(market, SIDE_LONG, 300n, 1n, 1000n, true, 1100n, {
                value: 500000000000000,
            })

            console.log("OtherWallet1 => ", await USD.balanceOf(otherAccount1))
            console.log("OtherWallet2 => ", await USD.balanceOf(otherAccount2))

            const orderContent = await orderBook.connect(otherAccount1).increaseOrders(0)
            console.log("Order Content is =>", orderContent)

            const cancalOrder = await orderBook.connect(otherAccount1).cancelIncreaseOrder(0, otherAccount1)
            console.log("Order is canceled!!")
            console.log("OtherWallet1 => ", await USD.balanceOf(otherAccount1))
            console.log("OtherWallet2 => ", await USD.balanceOf(otherAccount2))

            const orderContentAfter = await orderBook.connect(otherAccount1).increaseOrders(0)
            console.log("Order Content is =>", orderContentAfter)
        });

        it("Allownce test ", async () => {
            const { orderBook, market, otherAccount1, USD, ETH, owner, router, otherAccount2 } = await loadFixture(deployFixture);

            console.log("OtherWallet1 => ", await USD.balanceOf(otherAccount1))
            console.log("OtherWallet2 => ", await USD.balanceOf(otherAccount2))
            console.log("Owner Addrss => ", await owner.address)

            console.log("All =>", await USD.allowance(otherAccount1, router.target))
            await USD.connect(otherAccount1).approve(router.target, 1000000n)
            console.log("All =>", await USD.allowance(otherAccount1, router.target))
        });

    });


    describe("DecreaseOrder Test", async () => {
        it("Create DecreaseOrder", async () => {
            const {
                orderBook,
                market,
                otherAccount1,
                otherAccount2,
                USD,
                ETH,
                owner,
                router,
            } = await loadFixture(deployFixture)

            const usdBalance = await USD.balanceOf(otherAccount1)
            await expect()

        })
    })
})