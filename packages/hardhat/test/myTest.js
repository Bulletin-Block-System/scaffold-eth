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
      expect(firstBlockID).to.equal(1);
    });

    it('Should set Token Uri', async () => {
      const testUri = "testUri";
      await contract.addContentToBBlock(firstBlockID, testUri);
      expect(tokenURI(firstBlockID)).to.equal(testUri);
    });

    it('Should sell BBlock', async () => {
      await contract.sellBBlock(firstBlockID, 5);
      expect(idToBBlock[firstBlockID].owner).to.equal(payable(address(this)));
      expect(idToBBlock[firstBlockID].seller).to.equal(payable(msg.sender));
      expect(idToBBlock[firstBlockID].price).to.equal(5);
    });

    it('Should cancel a sale', async () => {
      expect(idToBBlock[firstBlockID].owner).to.equal(payable(msg.sender));
      expect(idToBBlock[firstBlockID].seller).to.equal(payable(address(0)));
    });

  });

});
  
  