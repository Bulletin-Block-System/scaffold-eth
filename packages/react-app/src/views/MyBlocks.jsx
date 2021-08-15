import { SyncOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, List, Progress, Slider, Spin, Switch } from "antd";
import React, { useState, useEffect } from "react";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useEventListener,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserSigner,
} from "../hooks";
import { Address, Balance } from "../components";
import AnsiImageRender from "./AnsiImageRender"

//import Button from "@material-ui/core/Button";
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Modal from '@material-ui/core/Modal';

const { ethers } = require("ethers");
import { NFTStorage, File } from 'nft.storage';
import { StoreFileOnIPFS } from "../helpers";

const nftStorageApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQzYjgwMzQ4MzY1MWE4MDE5MjU5NzQ2MjY5ZjM1ZDI4NUMzMEJlQjkiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYyODE1NzYxNTc3NCwibmFtZSI6ImtleTEifQ.G9BNydhDBxYJqYr06xSW-hRbkj5AptqaijFokHPx3h0';
const nftsClient = new NFTStorage({ token: nftStorageApiKey })

async function nftsTestStoreString(s) {
  const metadata = await nftsClient.store({
    name: 'nft.storage store test',
    description: 'Description: ' + s,
    image: new File(['<DATA>'], 'notansi.jpg', { type: 'image/jpg' }),
    //image: new Blob('XXX'),
    properties: {
      custom: 'Custom data can appear here, files are auto uploaded.',
      //file: new File(['<DATA>'], 'README.md', { type: 'text/plain' }),
      file: new File([new Blob(['this is a blob', 'by tomo'])], 'README.md', { type: 'text/plain' }),
    }
  })

  console.log('IPFS URL for the metadata:', metadata.url)
  console.log('metadata.json contents:\n', metadata.data)
  console.log('metadata.json with IPFS gateway URLs:\n', metadata.embed())
}


function getModalStyle() {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}
const useModalStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  scrollAnsiBlock: {
    fontSize: 24,
    lineHeight: '24px',
    height: 240,
    width: 270
  },
}));
function MakeBlockModal() {

  const classes = useModalStyles();
  // getModalStyle is not a pure function, we roll the style only on the first render
  const [modalStyle] = React.useState(getModalStyle);
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const body = (
    <div style={modalStyle} className={classes.paper}>
      <h2 id="simple-modal-title">Mint New Block!</h2>
      <p id="simple-modal-description">

        You will get the next available block. 
      </p><p>
        Current expected position:

      </p><p>
        Col: 0,
      </p><p>
        Row: 0
      </p>
      <button>MINT NEXT AVAILABLE BLOCK</button>
      <div>
        Current contents:
        
        <AnsiImageRender extraClass={classes.scrollAnsiBlock} tokenURI={"floppy.ans"} />
      </div><p>
        Choose .ans file to save into your chosen block:
        <input type="file" id="input" onChange={(evt) => console.log("event: ", evt, "selected file: ", evt.target.files[0])} />
      </p><p>
        A preview of your ANSi will appear here
      </p><p>
        TODO: <button>TEST FILE UPLOAD</button>
      </p>
    </div>
  );

  return (
    <div>
      <button type="button" onClick={handleOpen}>
        Manage Blocks / Mint &amp; Write / CLICK ME TO OPEN DIALOG
      </button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        {body}
      </Modal>
    </div>
  );
}

function ShowUpdateTokenUriModalDialog({ tx, readContracts, writeContracts, tokenId, contentChangeFee, isDefaultOpen, hideButton, onClose }) {

  isDefaultOpen = isDefaultOpen == undefined ? false : isDefaultOpen;
  const classes = useModalStyles();
  // getModalStyle is not a pure function, we roll the style only on the first render
  const [modalStyle] = React.useState(getModalStyle);
  const [open, setOpen] = React.useState(isDefaultOpen);
  const [selectedFileState, setSelectedFileState] = React.useState({});

  //const contentChangeFee = useContractReader(readContracts, "BBoard", "getContentChangeFee", [tokenId]);
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    };
  };

  var file;
  var fileObjectUrl;
  const processFile = (f) => {
    console.log('file selected', f);
    file = f;
    const reader = new FileReader();
    fileObjectUrl = window.URL.createObjectURL(f);
    let userMessage = 'File selected'
    let fileState = 'SELECTED';
    setSelectedFileState({ file, fileObjectUrl, userMessage, fileState });
  }

  const uploadFileAndProceed = async () => {
    let fileState = 'UPLOADING';
    let userMessage = 'Please wait. File is being uploaded to IPFS...';
    setSelectedFileState({ ...selectedFileState, userMessage, fileState })
    let metadata = await StoreFileOnIPFS('name', 'description', undefined, selectedFileState.file);
    userMessage = 'Approve transaction to change the token image to the newly uploaded image';
    fileState = 'UPLOADED';
    setSelectedFileState({ ...selectedFileState, metadata, userMessage, fileState });

    const result = await tx(writeContracts.BBoard.addContentToBBlock(tokenId, metadata.url, { value: contentChangeFee }), update => {
      console.log("📡 Transaction Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
        console.log(
          " ⛽️ " +
          update.gasUsed +
          "/" +
          (update.gasLimit || update.gas) +
          " @ " +
          parseFloat(update.gasPrice) / 1000000000 +
          " gwei",
        );
      }
    });

    userMessage = 'Image has been updated';
    fileState = 'APPROVED';
    setSelectedFileState({ ...selectedFileState, metadata, userMessage, fileState });
    handleClose();
  }

  const body = (
    <div style={modalStyle} className={classes.paper}>
      <h3>Change token image for Token Id: {tokenId}</h3>
      <p>Upload your new ANSI file here.</p>
      <p>The file will be uploaded to IPFS. This might take a while, please wait for it complete.</p>
      <p>You will be prompted to Approve a transaction once the file is uploaded. This is to update the new ipfs url into your token contract.</p>
      <p>Approve the transaction when the prompt is shown.</p>
      <p>There's a small fee of {contentChangeFee ? contentChangeFee.toString() : '...'} that increases after every write.</p>
      <p>
        <input type="file" id="input" onChange={(evt) => processFile(evt.target.files[0])} />
      </p><div>
        {fileObjectUrl}
        {selectedFileState.fileObjectUrl &&
          <AnsiImageRender extraClass={classes.scrollAnsiBlock} tokenURI={selectedFileState.fileObjectUrl} />}
      </div>
      <div>
        {selectedFileState.fileState == 'SELECTED' && selectedFileState.file && <button onClick={() => uploadFileAndProceed()}>Upload</button>}
        {selectedFileState.fileState == 'UPLOADING' && <Spin />}
        <p>{selectedFileState.userMessage}</p>
      </div>
    </div>
  );

  return (
    <div>
      {!hideButton &&
        <button type="button" onClick={handleOpen}>
          Change ANSi file
        </button>
      }
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        {body}
      </Modal>
    </div>
  );
}

// copied from ansi
const useStyles = makeStyles((theme) => ({
    root: {
          flexGrow: 1,
        },
    sectionH2: {
          fontFamily: '"Roboto", sans-serif', fontSize: '4em', textAlign: 'center', fontWeight: 800
    },
    scrollAnsiBlock: {
      fontSize: 24,
      lineHeight: '24px',
      height: 240,
      width: 270
    },
    paper: {
          padding: theme.spacing(2),
          textAlign: 'center',
          color: theme.palette.text.secondary,
          backgroundColor: 'lemonchiffon',
          margin: 20,
          border: '2px solid black',
          boxShadow: '8px 8px 0px 0',
        },
}));

function NakedBlockById({ tx, readContracts, tokenId }) {
  const classes = useStyles();
  const tokenURI = useContractReader(readContracts, "BBoard", "tokenURI", [tokenId], -1 /*not expecting updates POLLTIME*100*/);
  return (<AnsiImageRender key={'naked-' + tokenId} extraClass={classes.scrollAnsiBlock} tokenURI={tokenURI ? tokenURI : 'floppy.ans'} />)
}
function GenesisScroll({ tx, readContracts /*, writeContracts, browserAddress, blockMintFee*/ } ) {
  const classes = useStyles();
  const indices = [...Array(16)].map((_, i) => i);
  //const bBlockURIs = [...Array(16)].map((_, i) => useContractReader(readContracts, "BBoard", "tokenURI", [i], POLLTIME*100));
  return (
    <div className={classes.root}>
      <Grid container justifyContent="center">
        <h2 className={classes.sectionH2}>Genesis Scroll</h2>
        <div className="ansi-grid-wrapper" style={{color: 'white', backgroundColor: 'black'}}>
          <Grid container >
            {indices.slice(0, 4).map((idx) => (<NakedBlockById key={idx} tx={tx} readContracts={readContracts} tokenId={idx} />))}
          </Grid><Grid container spacing={3,0} >
            {indices.slice(4, 8).map((idx) => (<NakedBlockById key={idx} tx={tx} readContracts={readContracts} tokenId={idx} />))}
          </Grid><Grid container spacing={3,0} >
            {indices.slice(8, 12).map((idx) => (<NakedBlockById key={idx} tx={tx} readContracts={readContracts} tokenId={idx} />))}
          </Grid><Grid container spacing={3,0} >
            {indices.slice(8, 12).map((idx) => (<NakedBlockById key={idx} tx={tx} readContracts={readContracts} tokenId={idx} />))}
          </Grid>
        </div>
      </Grid>
    </div>
  )
}
  
function MintBlockCard({ readContracts, blockMintFee } ) {
  //const tokenSupply = useContractReader(readContracts, "BBoard", "tokenSupply");
  const tokenSupply = useContractReader(readContracts, "BBoard", "getBBlockIdCounter");

  const nextBlockID = tokenSupply ? tokenSupply.toNumber() + 1 : 0; // XXX check, off by 1?
  const classes = useStyles();
  return (
        <Grid item xs >
          <Paper className={classes.paper} style={{backgroundColor: 'ghostwhite'}} >
            <div className="ansi-wrapper" style={{display: 'inline-block'}} >
              <AnsiImageRender extraClass={classes.scrollAnsiBlock} tokenURI={'buynextblock.txt'} />
            </div>
            <h3>THIS NEXT BLOCK COULD BE YOURS!!!</h3>
            <h3>Mint fee: {blockMintFee ? blockMintFee.toString() : '...loading' }</h3>
            <ul><li>Row: {Math.floor(nextBlockID / 4)}</li><li>Col: {nextBlockID % 4}</li><li>Owner: YOU???</li></ul>
          </Paper>
        </Grid>
  )
}


function BlockCards1({ tx, readContracts, writeContracts, browserAddress, blockMintFee, i } ) {
  const b = useContractReader(readContracts, "BBoard", "fetchBBlockById", [i], -1 /* -1 no timer POLLTIME*100*/);
  // [bblockId, owner, price, seller]
  return !b ? '' : (<BlockCard key={'block-gen-' + b.bblockId.toString()} tx={tx} writeContracts={writeContracts} readContracts={readContracts} browserAddress={browserAddress} blockMintFee={blockMintFee} tokenId={b.bblockId} ownerAddress={b.owner} seller={b.seller} price={b.price} />);
}
function BlockCards1stDozen({ tx, readContracts, writeContracts, browserAddress, blockMintFee } ) {
  return [...Array(12)].map((_, i) => (<BlockCards1 key={'b1st-'+i} tx={tx} readContracts={readContracts} writeContracts={writeContracts} browserAddress={browserAddress} blockMintFee={blockMintFee} i={i} />));
}

function BlockCardsForSale({ tx, readContracts, writeContracts, browserAddress, blockMintFee } ) {
  const bBlocks = useContractReader(readContracts, "BBoard", "fetchBBlocksForSale", POLLTIME/10);
  console.log(bBlocks);
  // [bblockId, owner, price, seller]
  return bBlocks ? bBlocks.map((b) => (<BlockCard key={'block-sale-' + b.bblockId} tx={tx} writeContracts={writeContracts} readContracts={readContracts} browserAddress={browserAddress} blockMintFee={blockMintFee} tokenId={b.bblockId} ownerAddress={b.owner} seller={b.seller} price={b.price} />)) : (<span>...loading</span>);
}

const POLLTIME = 30000;
function BlockCardsByAddress({ tx, readContracts, writeContracts, browserAddress, blockMintFee, ownerAddress } ) {
  // TODO try useEffect
  const bBlocks = useContractReader(readContracts, "BBoard", "fetchBBlocksByAddress", [ownerAddress], POLLTIME/3);
  console.log(bBlocks);
  // [bblockId, owner, price, seller]
  return bBlocks ? bBlocks.map((b) => (<BlockCard key={'block-addr-' + b.bblockId} tx={tx} writeContracts={writeContracts} readContracts={readContracts} browserAddress={browserAddress} blockMintFee={blockMintFee} tokenId={b.bblockId} ownerAddress={b.owner} seller={b.seller} price={b.price} />)) : (<span>...loading</span>);
}

function BlockCardsRecentlySaved({ tx, readContracts, writeContracts, browserAddress, blockMintFee } ) {
  const bBlocks = useContractReader(readContracts, "BBoard", "fetchLastNFTs", POLLTIME);
  console.log(bBlocks);
  const _bBlocks = bBlocks ? bBlocks.filter((item, index, self) => self.findIndex(x => x.bblockId.toNumber() == item.bblockId.toNumber()) == index) : 0;
  console.log(_bBlocks);
  // [bblockId, owner, price, seller]
  return bBlocks ? _bBlocks.map((b) => (<BlockCard key={'block-rs-' + b.bblockId} tx={tx} writeContracts={writeContracts} readContracts={readContracts} browserAddress={browserAddress} blockMintFee={blockMintFee} tokenId={b.bblockId} ownerAddress={b.owner} seller={b.seller} price={b.price} />)) : (<span>...loading</span>);
}

function BlockCard({ tx, readContracts, writeContracts, blockMintFee, browserAddress, tokenId, ownerAddress, seller, price } ) {
  // TODO make props 
  const tokenURI = useContractReader(readContracts, "BBoard", "tokenURI", [tokenId], POLLTIME*10);
  const contentChangeFee = useContractReader(readContracts, "BBoard", "getContentChangeFee", [tokenId], POLLTIME*10);
  // XXX is tokenId and bBlockId the same? is it reliable to calculate position?
  const classes = useStyles();
  const defaultSellPrice = 1000;
  let localTokenId = tokenId.toNumber();
  return (
        <Grid key={tokenId} item xs >
          <Paper className={classes.paper} style={{maxWidth: 400}}>
            <div className="ansi-wrapper" style={{display: 'inline-block'}} >
              <AnsiImageRender extraClass={classes.scrollAnsiBlock} tokenURI={tokenURI ? tokenURI : 'floppy.ans'} />
            </div>
            <h3>URI: {tokenURI}</h3>
            <ul>
              <li>TokenId: {localTokenId}</li>
              <li>Row: {Math.floor(tokenId / 4)}</li>
              <li>Col: {tokenId % 4}</li>
              <li>Owner: {ownerAddress}</li>
              <li>Sale Status: {seller}</li>
              <li>Price: {price ? price.toString() : 'N/A'}</li>
              <li>Write Fee: {contentChangeFee ? contentChangeFee.toString() : 'N/A'}</li>
            </ul>
            <ShowUpdateTokenUriModalDialog tokenId={localTokenId} contentChangeFee={contentChangeFee} isDefaultOpen={false} tx={tx} readContracts={readContracts} writeContracts={writeContracts} hideButton={false} />
            <Button
              /* MUI color="primary" variant="outlined" */
              type="primary" size="large"
              disabled={price == 0}
              style={{ marginTop: 8 }}
              onClick={async () => {
                /* look how you call setPurpose on your contract: */
                /* notice how you pass a call back for tx updates too */
                // TODO function doesn't return but emits event we should watch for
                const result = tx(writeContracts.BBoard.buyBBlock(tokenId, {
                  value: price + blockMintFee
                }), update => {
                  console.log("📡 Transaction Update:", update);
                  if (update && (update.status === "confirmed" || update.status === 1)) {
                    console.log(" 🍾 Transaction " + update.hash + " finished!");
                    console.log(
                      " ⛽️ " +
                      update.gasUsed +
                      "/" +
                      (update.gasLimit || update.gas) +
                      " @ " +
                      parseFloat(update.gasPrice) / 1000000000 +
                      " gwei",
                    );
                  }
                });
                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
              }}
            >
              Buy @{`${price} + ${blockMintFee}`}!
            </Button>
            <Button
              /* MUI color="primary" variant="outlined" */
              type="primary" size="large"
              disabled={ownerAddress != browserAddress}
              style={{ marginTop: 8 }}
              onClick={async () => {
                /* look how you call setPurpose on your contract: */
                /* notice how you pass a call back for tx updates too */
                // TODO function doesn't return but emits event we should watch for
                const result = tx(writeContracts.BBoard.sellBBlock(tokenId, defaultSellPrice, {
                  value: blockMintFee
                }), update => {
                  console.log("📡 Transaction Update:", update);
                  if (update && (update.status === "confirmed" || update.status === 1)) {
                    console.log(" 🍾 Transaction " + update.hash + " finished!");
                    console.log(
                      " ⛽️ " +
                      update.gasUsed +
                      "/" +
                      (update.gasLimit || update.gas) +
                      " @ " +
                      parseFloat(update.gasPrice) / 1000000000 +
                      " gwei",
                    );
                  }
                });
                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
              }}
            >
              Put For Sale @{defaultSellPrice}!
            </Button>
            <Button
              /* MUI color="primary" variant="outlined" */
              type="primary" size="large"
              disabled={seller != browserAddress}
              style={{ marginTop: 8 }}
              onClick={async () => {
                /* look how you call setPurpose on your contract: */
                /* notice how you pass a call back for tx updates too */
                // TODO function doesn't return but emits event we should watch for
                const result = tx(writeContracts.BBoard.cancelSale(tokenId), update => {
                  console.log("📡 Transaction Update:", update);
                  if (update && (update.status === "confirmed" || update.status === 1)) {
                    console.log(" 🍾 Transaction " + update.hash + " finished!");
                    console.log(
                      " ⛽️ " +
                      update.gasUsed +
                      "/" +
                      (update.gasLimit || update.gas) +
                      " @ " +
                      parseFloat(update.gasPrice) / 1000000000 +
                      " gwei",
                    );
                  }
                });
                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
              }}
            >
              Cancel Sale
            </Button>
          </Paper>
        </Grid>
  )
}

export default function MyBlocks({
  blockMintFee,
  myBBlocksCount,
  address,
  filterAddress,
  setFilterAddress,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  tx,
  readContracts,
  writeContracts,
}) {
  const classes = useStyles();
  const [newFilterAddress, setNewFilterAddress] = useState();
  const [addressBlockCount, setAddressBlockCount] = useState('...');
  const [newTokenId, setNewTokenId] = useState(0);
  const [showUpdateTokenUriModal, setshowUpdateTokenUriModal] = useState(false);


  const blocksCount = myBBlocksCount ? (
    address == filterAddress ? myBBlocksCount.toNumber() : addressBlockCount
  ) : 0;

  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: "1px solid #cccccc", padding: 16, /*width: 400,*/ margin: "auto", marginTop: 64 }}>
        {/*<h2>Bulletin Block System Permissionless Distributed UI:</h2>*/}
        {/* <h4>purpose: {purpose}</h4> */}
        <GenesisScroll tx={tx} readContracts={readContracts} />
        <Divider />
        <Grid container justifyContent="center">
          <Grid item>
            <h2 className={classes.sectionH2}>{'Genesis Blocks'}</h2>
            <Grid container spacing={3,0} >
              <BlockCards1stDozen tx={tx} readContracts={readContracts} writeContracts={writeContracts} browserAddress={address} blockMintFee={blockMintFee} />
            </Grid>
            <Divider />
            <h2 className={classes.sectionH2}>{filterAddress == addressBlockCount ? 'Your Blocks' : 'Blocks By Address'} ({blocksCount})</h2>
            <p>currently {addressBlockCount} blocks at {filterAddress}</p>
            <Input
              onChange={e => {
                setNewFilterAddress(e.target.value);
              }}
            />
            <Button
              style={{ marginTop: 8 }}
              onClick={async () => {
                let addr;
                try {
                  addr = ethers.utils.getAddress(newFilterAddress);
                } catch(e) {
                  console.log('bad address ', newFilterAddress);
                  return;
                }
                setFilterAddress(addr);
                const result = await /*tx*/(readContracts.BBoard.balanceOf(addr));
                setAddressBlockCount(result.toNumber());
              }}
            >Show Blocks of Another Address
            </Button>
            <Grid container spacing={3,0} >
              <BlockCardsByAddress tx={tx} readContracts={readContracts} writeContracts={writeContracts} browserAddress={address} blockMintFee={blockMintFee} ownerAddress={filterAddress} />
            </Grid>
            <Grid container spacing={3}>
              <Grid item>
                <p>
                  <a href="#">Load more... (assuming there are more)</a>
                </p>
              </Grid>
            </Grid>
            <Divider />
            <h2 style={{fontFamily: '"Roboto", sans-serif', fontSize: '4em', fontWeight: 800}} className='foobar'>Blocks For Sale</h2>
            <Grid container spacing={3,0} >
              <BlockCardsForSale tx={tx} readContracts={readContracts} writeContracts={writeContracts} browserAddress={address} blockMintFee={blockMintFee} />
            </Grid>
            <Grid container spacing={3}>
              <Grid item>
                <p>
                  <a href="#">Load more... (assuming there are more)</a>
                </p>
              </Grid>
            </Grid>
            <Divider />
            <h2 style={{fontFamily: '"Roboto", sans-serif', fontSize: '4em', fontWeight: 800}} className='foobar'>Mint an Empty Block</h2>
            <Grid container justifyContent="center"><Grid item>
              <MintBlockCard readContracts={readContracts} blockMintFee={blockMintFee} />
            </Grid></Grid>
            <Button
              /* MUI color="primary" variant="outlined" */
              type="primary" size="large"
              style={{ marginTop: 8 }}
              onClick={async () => {
                /* look how you call setPurpose on your contract: */
                /* notice how you pass a call back for tx updates too */
                // TODO we need to await return value of the function which is tokenId/bBlockId
                //const result = tx(writeContracts.BBoard.createToken({
                const _tx = await writeContracts.BBoard.createToken({
                  value: blockMintFee
                });/*, update => {
                  console.log("📡 Transaction Update:", update);
                  if (update && (update.status === "confirmed" || update.status === 1)) {
                    console.log(" 🍾 Transaction " + update.hash + " finished!");
                    console.log(
                      " ⛽️ " +
                      update.gasUsed +
                      "/" +
                      (update.gasLimit || update.gas) +
                      " @ " +
                      parseFloat(update.gasPrice) / 1000000000 +
                      " gwei",
                    );
                  }
                });
                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
                */
                let receipt = await _tx.wait(5);
                console.log(receipt);
                // let evt = receipt.events.pop();
                // if (evt.event !== "BBlockCreated") {
                //   evt = receipt.events.pop(); // XXX HACK
                // }
                // console.assert(evt.event == "BBlockCreated", "bad event returned");
                let evt = receipt.events.find(e => e.event == "BBlockCreated");
                console.assert(evt?.event == "BBlockCreated", "bad event returned");
                console.log(evt);
                //console.log('RETURNED ', evt.args.tokenId);
                console.log('RETURNED ', evt?.args[0].toNumber());
                // TODO save this new bblockId in local state, load it above in Your Blocks

                if (evt.event == "BBlockCreated") {
                  let mintedTokenId = evt.args[0].toNumber();
                  console.log('block minted', mintedTokenId);
                  setNewTokenId(mintedTokenId);
                  setshowUpdateTokenUriModal(true);
                }
              }}
            >
              Mint!
            </Button>
            {showUpdateTokenUriModal && newTokenId && 
            <ShowUpdateTokenUriModalDialog tokenId={newTokenId} contentChangeFee={blockMintFee /*XXX assumes initial blockMintFee=contentChangeFee*/} isDefaultOpen={true} tx={tx} writeContracts={writeContracts} hideButton={true} onClose={() =>setshowUpdateTokenUriModal(false)}/>
            }
            <Divider />
            <h2 style={{fontFamily: '"Roboto", sans-serif', fontSize: '4em', fontWeight: 800}} className='foobar'>Recently Saved Blocks</h2>
            <Grid container spacing={3,0} >
              <BlockCardsRecentlySaved tx={tx} readContracts={readContracts} writeContracts={writeContracts} browserAddress={address} blockMintFee={blockMintFee} />
            </Grid>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
