const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BBoard", function () {
  it("Should change bblocks content and show recently changed", async function () {
    //get reference to bboard contract
    const BBoard = await ethers.getContractFactory("BBoard");
    //deploy the bboard contract
    const bboard = await BBoard.deploy();
    await bboard.deployed();
    const bboardAddress = bboard.address;

    //call functions
    let basefee = await bboard.getBasefee();

    console.log(basefee.toString());

    let lastChangedBBlock;

    //case: more than 12 items
    // for(let i = 0; i<20;i++){
    //   let transaction = await bboard.createToken({value:basefee});
    //   let tx = await transaction.wait()

    //   let event = tx.events[0]
    //   let value = event.args[2]
    //   let bblockId = value.toNumber()
    //   lastChangedBBlock=bblockId;
    //   let vfee = await bboard.getContentChangeFee(bblockId);

    //   await  bboard.addContentToBBlock(bblockId, `URISTRINGSHIZ__${i}`,{value:vfee});
    //   let uri = await bboard.tokenURI(bblockId);
    //   console.log("bblock " +i+ " "+uri);
    // }

    //case: less than 12 items
    for (let i = 0; i < 6; i++) {
      let transaction = await bboard.createToken({ value: basefee });
      let tx = await transaction.wait();

      let event = tx.events[0];
      let value = event.args[2];
      let bblockId = value.toNumber();
      lastChangedBBlock = bblockId;
      let vfee = await bboard.getContentChangeFee(bblockId);

      await bboard.addContentToBBlock(bblockId, `URISTRINGSHIZ__${i}`, {
        value: vfee,
      });
      let uri = await bboard.tokenURI(bblockId);
      console.log("bblock " + i + " " + uri);
    }

    let items = await bboard.fetchLastNFTs();

    for (let i = 0; i < items.length; i++) {
      let bb = items[i].bblockId.toNumber();
      console.log(bb);
    }

    expect(items.length).to.lte(12);
    expect(items[0].bblockId.toNumber()).to.equal(lastChangedBBlock);
  });
});
