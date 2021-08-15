// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

contract BBoard is ERC721, ERC721URIStorage {
    using Counters for Counters.Counter;
    //id for each created bblock
    Counters.Counter private _bblockIds;

    address payable owner;
    //this is a fee in deployed network (matic) currency
    uint256 private basefee = 500;
    uint256 private maxBBlocks = 400;
    bool private useFeeMultiplier = true;
    uint256[] private bblocksUpdated;

    constructor() ERC721("BulletinBlock", "BBLK") {
        owner = payable(msg.sender);
    }

    struct BBlock {
        uint256 bblockId;
        address payable seller;
        address payable owner;
        uint256 price;
        uint256 feeMultiplier;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    //map where bblockId returns the BBlock
    mapping(uint256 => BBlock) private idToBBlock;

    event BBlockCreated(uint256 indexed bblockId, address owner);
    event SaleCreated(uint256 indexed bblockId, address seller, uint256 price);

    function getBasefee() public view returns (uint256) {
        return basefee;
    }

    function setBasefee(uint256 x) public onlyOwner {
        basefee = x;
    }

    function createToken() public payable returns (uint256) {
        require(
            getBBlockIdCounter() <= getMaxBBlocks(),
            "max limit for BBlocks reached!"
        );
        require(msg.value == getBasefee(), "Price must be equal to basefee");
        owner.transfer(getBasefee());
        uint256 newBBlockId = _bblockIds.current();
        _bblockIds.increment();
        _mint(msg.sender, newBBlockId);
        //save new bblock
        addNewBBlock(newBBlockId);
        //needed for subsequent sale of the block/nft
        return newBBlockId;
    }

    function addNewBBlock(uint256 bblockId) private {
        idToBBlock[bblockId] = BBlock(
            bblockId,
            payable(address(0)),
            payable(msg.sender),
            0,
            0
        );

        emit BBlockCreated(bblockId, payable(msg.sender));
    }

    function addContentToBBlock(uint256 bblockId, string memory URI)
        public
        payable
    {
        require(
            msg.sender == ERC721.ownerOf(bblockId),
            "You don't own this BBlock"
        );

        require(
            msg.value == getContentChangeFee(bblockId),
            "Value must be equal to fee"
        );

        owner.transfer(getContentChangeFee(bblockId));

        _setTokenURI(bblockId, URI);
        bblocksUpdated.push(bblockId);
        if (getBoolContentChangeFee()) idToBBlock[bblockId].feeMultiplier++;
    }

    function setTokenURI(uint256 bblockId, string memory URI) public onlyOwner {
        _setTokenURI(bblockId, URI);
    }

    function sellBBlock(uint256 bblockId, uint256 price) public payable {
        require(
            idToBBlock[bblockId].seller == payable(address(0)),
            "BBlock already for sale"
        );
        require(
            msg.sender == ERC721.ownerOf(bblockId),
            "You don't own this BBlock"
        );

        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == getBasefee(), "Price must be equal to basefee");

        //pay the fee
        owner.transfer(msg.value);

        //transfer ownership
        transferFrom(msg.sender, payable(address(this)), bblockId);

        idToBBlock[bblockId].owner = payable(address(this));
        idToBBlock[bblockId].seller = payable(msg.sender);
        idToBBlock[bblockId].price = price;

        emit SaleCreated(bblockId, msg.sender, price);
    }

    function cancelSale(uint256 bblockId) public {
        // require(1 == 2, "nope");

        require(
            payable(msg.sender) == idToBBlock[bblockId].seller,
            "You are not the seller of this BBlock"
        );

        //transfer ownership
        IERC721(address(this)).transferFrom(
            address(this),
            idToBBlock[bblockId].seller,
            bblockId
        );
        idToBBlock[bblockId].owner = payable(msg.sender);
        idToBBlock[bblockId].seller = payable(address(0));
        idToBBlock[bblockId].price = 0;
    }

    function buyBBlock(uint256 bblockId) public payable {
        require(
            idToBBlock[bblockId].seller != msg.sender,
            "seller can't be buyer"
        );
        require(
            idToBBlock[bblockId].seller != payable(address(0)),
            "BBlock not for sale"
        );
        // require(1 == 2, "nope");

        uint256 price = idToBBlock[bblockId].price;

        require(
            msg.value == price + getBasefee(),
            "Value must be equal to price + basefee"
        );

        //pay the seller
        idToBBlock[bblockId].seller.transfer(price);

        //transfer ownership
        IERC721(address(this)).transferFrom(
            address(this),
            msg.sender,
            bblockId
        );

        idToBBlock[bblockId].seller = payable(address(0));
        idToBBlock[bblockId].owner = payable(msg.sender);

        owner.transfer(getBasefee());
        idToBBlock[bblockId].feeMultiplier = 0;
    }

    function getPrice(uint256 bblockId) public view returns (uint256) {
        return idToBBlock[bblockId].price;
    }

    function fetchBBlockById(uint256 bblockId)
        public
        view
        returns (BBlock memory)
    {
        return idToBBlock[bblockId];
    }

    function fetchBBlocksByAddress(address adr)
        public
        view
        returns (BBlock[] memory)
    {
        uint256 totalItemCount = _bblockIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToBBlock[i].owner == adr) {
                itemCount += 1;
            }
        }

        BBlock[] memory items = new BBlock[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToBBlock[i].owner == adr) {
                uint256 currentId = i;
                BBlock storage currentItem = idToBBlock[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchBBlocksForSale() public view returns (BBlock[] memory) {
        uint256 totalItemCount = _bblockIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToBBlock[i].seller != payable(address(0))) {
                itemCount += 1;
            }
        }

        BBlock[] memory items = new BBlock[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToBBlock[i].seller != payable(address(0))) {
                uint256 currentId = i;
                BBlock storage currentItem = idToBBlock[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function getBBlockIdCounter() public view returns (uint256) {
        return _bblockIds.current();
    }

    function fetchLastNFTs() public view returns (BBlock[] memory) {
        uint256 itemCount = 12;
        uint256 currentIndex = 0;
        uint256 x;
        if (bblocksUpdated.length > 12) {
            x = bblocksUpdated.length - 12;
        } else {
            itemCount = bblocksUpdated.length;
        }
        BBlock[] memory items = new BBlock[](itemCount);

        for (uint256 i = bblocksUpdated.length; i > x; i--) {
            BBlock storage currentItem = idToBBlock[bblocksUpdated[i - 1]];
            items[currentIndex] = currentItem;
            currentIndex += 1;
        }

        return items;
    }

    function getFeeMultiplier(uint256 bblockId) public view returns (uint256) {
        require(getBBlockIdCounter() >= bblockId);
        return idToBBlock[bblockId].feeMultiplier;
    }

    function getContentChangeFee(uint256 bblockId)
        public
        view
        returns (uint256)
    {
        if (getBoolContentChangeFee()) {
            return (idToBBlock[bblockId].feeMultiplier *
                ((getBasefee() * 1000) / 10000) +
                getBasefee());
        } else {
            return getBasefee();
        }
    }

    function getMaxBBlocks() public view returns (uint256) {
        return maxBBlocks;
    }

    function setMaxBBlocks(uint256 value) public onlyOwner {
        maxBBlocks = value;
    }

    function setBoolContentChangeFee(bool value) public onlyOwner {
        useFeeMultiplier = value;
    }

    function getBoolContentChangeFee() public view returns (bool) {
        return useFeeMultiplier;
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(_exists(tokenId));
        return super.tokenURI(tokenId);
    }
}
