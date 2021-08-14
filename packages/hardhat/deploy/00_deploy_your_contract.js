// deploy/00_deploy_your_contract.js

//const { utils } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  // await deploy("YourContract", {
  //   // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
  //   from: deployer,
  //   // args: [ "Hello", utils.parseEther("1.5") ],
  //   log: true,
  // });

  const bboard = await deploy("BBoard", {
    from: deployer,
    log: true,
  });

  // await deploy("NFT", {
  //   // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
  //   from: deployer,
  //   args: [bboard.address],
  //   log: true,
  // });

  // const NFT = await ethers.getContract("NFT", deployer);
  const BBoard = await ethers.getContract("BBoard", deployer);
  let baseFee = await BBoard.getBasefee();
  baseFee = baseFee.toString();

  for (let count = 0; count < 13; count++) {
    await BBoard.createToken({ value: baseFee });
  }
  await BBoard.setTokenURI(
    0,
    "ipfs://bafyreifappl3rwoghu4urnyttalfijdsavdwqxv35esp2z5lxahhnffodq/metadata.json"
  );
  await BBoard.setTokenURI(
    1,
    "ipfs://bafyreibu3rvfq6guizvqbdndkwppzj6blq7q55fbqzx6v2y3csfiucj2qu/metadata.json"
  );
  await BBoard.setTokenURI(
    2,
    "ipfs://bafyreiaiezstqyb6xoyvhpj2re5gsyb7ajttsnqmsft35s4njv6m3fmgbu/metadata.json"
  );
  await BBoard.setTokenURI(
    3,
    "ipfs://bafyreiezia2pdtpb3kheqtv3efdv7nxbb7cvxftemwqomy3xe2t55n3cma/metadata.json"
  );
  await BBoard.setTokenURI(
    4,
    "ipfs://bafyreidjit5ngt76vou5slin3b55yhaldehj3quzkihgopbzrqwvidx46m/metadata.json"
  );
  await BBoard.setTokenURI(
    5,
    "ipfs://bafyreihpwgm6dbfb2aj2vyoqltxuvgpe7q4bxgvtcxfbf3llriz3vmxcka/metadata.json"
  );
  await BBoard.setTokenURI(
    6,
    "ipfs://bafyreiant54tanwwwqmp5kpw72ugzmk575nx5y4fsaf5irchddulb7j4ku/metadata.json"
  );
  await BBoard.setTokenURI(
    7,
    "ipfs://bafyreiagjk5hd6fn5zxwpajw66cvcnc544fxdgevkfmw3k4pyoutnioei4/metadata.json"
  );
  await BBoard.setTokenURI(
    8,
    "ipfs://bafyreifblzrat4tzorrfvxqvkvbshwovburpe65t7epz3xkudq2hofyo7a/metadata.json"
  );
  await BBoard.setTokenURI(
    9,
    "ipfs://bafyreia66lggcxloalo6ljukc6vayznbm74eyy4vlu5k5wyazetv4mktve/metadata.json"
  );
  await BBoard.setTokenURI(
    10,
    "ipfs://bafyreideayrlti4dsjcd34a5v2by45yxkovkfakrv6yicxp333ejgvr25m/metadata.json"
  );
  await BBoard.setTokenURI(
    11,
    "ipfs://bafyreidtqnplvyukhsmu4rxftelpj4rmapwhkxr7dinpelfpuo7iojilam/metadata.json"
  );

  for (let count = 13; count < 100; count++) {
    await BBoard.createToken({ value: baseFee });
    console.log(count);
  }

  console.log("100 BBlocks minted for deployer " + deployer);

  const idsCounter = await BBoard.getBBlockIdCounter();
  console.log("tokenIds counter: " + idsCounter);
  console.log("basefee set to " + baseFee);

  /*
    // Getting a previously deployed contract
    const YourContract = await ethers.getContract("YourContract", deployer);
    await YourContract.setPurpose("Hello");

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */
};
module.exports.tags = ["YourContract", "NFT", "BBoard"];
