const hre = require("hardhat");

async function main() {
  const networkName = hre.network.name;
  console.log(`🌐 Target Network: ${networkName}`);

  const signers = await hre.ethers.getSigners();
  if (!signers || signers.length === 0) {
    console.error(`❌ Deployment aborted: No deployer account available for network '${networkName}'.`);
    if (networkName === "polygonAmoy") {
      console.error("👉 Please set POLYGON_ISSUER_PRIVATE_KEY in your .env file with a funded Polygon Amoy account.");
    }
    process.exit(1);
  }

  const deployer = signers[0];
  console.log(`👤 Deployer Address: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const formattedBalance = hre.ethers.formatEther(balance);
  console.log(`💰 Deployer Balance: ${formattedBalance} POL`);

  if (networkName !== "hardhat" && networkName !== "localhost" && balance === 0n) {
    console.error(`❌ Deployment aborted: Deployer has 0 balance on ${networkName}.`);
    console.error("👉 Please fund this address using the Polygon Amoy Faucet: https://faucet.polygon.technology/");
    process.exit(1);
  }

  console.log("🚀 Deploying SkillChainCredentialRegistry smart contract...");
  const RegistryFactory = await hre.ethers.getContractFactory("SkillChainCredentialRegistry");

  let registry;
  try {
    registry = await RegistryFactory.deploy(deployer.address);
  } catch (deployErr) {
    console.error("❌ Failed to broadcast deployment transaction:", deployErr.message);
    process.exit(1);
  }

  console.log("⏳ Awaiting transaction confirmation...");
  try {
    await registry.waitForDeployment();
  } catch (waitErr) {
    console.error("❌ Transaction failed or timed out during deployment:", waitErr.message);
    process.exit(1);
  }

  const contractAddress = await registry.getAddress();
  const deployTx = registry.deploymentTransaction();

  console.log("\n=======================================================");
  console.log("✅ CONTRACT DEPLOYMENT CONFIRMED SUCCESSFUL");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Deployment Tx Hash: ${deployTx ? deployTx.hash : "N/A"}`);
  console.log(`🏷️  Network: ${networkName} (Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId})`);
  console.log("=======================================================\n");

  // In local or testnet mode, register the default deployer as an authorized issuer
  try {
    console.log("🏛️ Registering default deployer as an authorized institutional issuer...");
    const tx = await registry.registerIssuer(
      deployer.address,
      "SkillChain Demo Accreditation Authority",
      "https://skillchain.org/issuers/demo"
    );
    await tx.wait();
    console.log("✅ Default deployer successfully registered as authorized issuer.");
  } catch (issuerErr) {
    console.warn("⚠️ Issuer registration note:", issuerErr.message);
  }

  return {
    contractAddress,
    deployer: deployer.address,
    network: networkName,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed with error:", error);
    process.exit(1);
  });
