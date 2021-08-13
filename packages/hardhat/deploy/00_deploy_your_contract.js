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
  // const BBoard = await ethers.getContract("BBoard", deployer);
  // let baseFee = await BBoard.getBasefee();
  //  baseFee = baseFee.toString();

  // console.log(baseFee);

  // for(let count = 1; count<=100;count++){
  //   await BBoard.createToken({value:baseFee});
  //   console.log(count + "/100 BBlocks minted");
  // }


  console.log("100 BBlocks minted for deployer " + deployer)

  const idsCounter = await BBoard.getBBlockIdCounter()
  console.log("tokenIds counter: "+ idsCounter)


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
module.exports.tags = ["YourContract","NFT","BBoard"];
