const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("BBoard Contract", () => {
  let myContract, contract, owner, addr1, addr2;

  beforeEach(async () => {
    myContract = await ethers.getContractFactory('BBoard');
    contract = await myContract.deploy();
    [owner, addr1, addr2, _] = await ethers.getSigners();
  });

  describe('Deployment', () => {
    it('Should set the owner of the contract', async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });
  });

  describe('Create Token', () => {
    it('Should create a token and return his ID', async () => {
      const firstBlockID = await contract.CreateToken();
      const secondBlockID = await contract.CreateToken();
      expect(firstBlockID).to.equal(1);
      expect(secondBlockID).to.equal(2);
    });

    it('Should set Token Uri', async () => {
      const testUri = "testUri";
      await contract.addContentToBBlock(firstBlockID, testUri);
      expect(tokenURI(firstBlockID)).to.equal(testUri);
    });

    it('Should create BBlock sale', async () => {
      await contract.sellBBlock(firstBlockID, 5);
      await contract.sellBBlock(secondBlockID, 5);
      expect(idToBBlock[firstBlockID].owner).to.equal(payable(address(this)));
      expect(idToBBlock[firstBlockID].seller).to.equal(payable(msg.sender));
      expect(idToBBlock[firstBlockID].price).to.equal(5);
    });

    it('Should cancel a sale', async () => {
      await contract.cancelSale(firstBlockID);
      expect(idToBBlock[firstBlockID].owner).to.equal(payable(msg.sender));
      expect(idToBBlock[firstBlockID].seller).to.equal(payable(address(0)));
      expect(idToBBlock[firstBlockID].price).to.equal(0);
    });

    it('Should buy a BBlock', async () => {
      await contract.buyBBlock(secondBlockID);
      expect(idToBBlock[secondBlockID].owner).to.equal(payable(msg.sender));
      expect(idToBBlock[secondBlockID].seller).to.equal(payable(address(0)));
    });

  });

});
  
  