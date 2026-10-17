const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying SkillChainCredentialRegistry with deployer address:", deployer.address);

  const RegistryFactory = await hre.ethers.getContractFactory("SkillChainCredentialRegistry");
  const registry = await RegistryFactory.deploy(deployer.address);
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("✅ SkillChainCredentialRegistry deployed to:", contractAddress);
  console.log("Network:", hre.network.name);

  // In local or testnet mode, auto-register the default deployer as an authorized issuer for demonstration
  const tx = await registry.registerIssuer(
    deployer.address,
    "Demo Accreditation Authority",
    "https://skillchain.org/issuers/demo"
  );
  await tx.wait();
  console.log("🏛️ Default deployer registered as authorized issuer.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
