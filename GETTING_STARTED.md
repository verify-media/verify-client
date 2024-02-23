_Note: this guide assumes publishing on testnet using a [sandbox](https://docs.verifymedia.com/smart-contracts/#sandbox) env_

## Configure

To start publishing the sdk needs to be configured with some settings. It can be done either by setting environment variables in the execution context or by passing it as parameters to init config function.

- Go ahead and create a .env file at the root of test-verifymedia-client (created during [quick start](https://github.com/verify-media/verify-client/blob/main/README.md#quick-start)) project and add the following env variables

```bash
DEBUG=0 # 0 if false and 1 is true with default false. When true print debug logs
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/demo # allows for a developer to interact with an Ethereum node via HTTP(S)
STAGE=testnet
CHAIN_ID=80001
CHAIN=mumbai
MAX_GAS_PRICE=30000000000 #if set a transaction will not be performed if network gas is above this limit
ROOT_PVT_KEY=<root_pvt_key> # private key for the root wallet which acts as the publishers identity
PVT_KEY=<intermediate_pvt_key> # private key for the intermediate wallet which acts as the signer, there could be more than one signer wallets hence its preferred to pass this value as a parameter instead
WALLET_EXPIRY_DAYS=3 # number for days for which the intermediate wallet is active and authorized
ORG_NAME=<org_name> # name of the publisher
```

- we recommend installing [dotenv](https://www.npmjs.com/package/dotenv) npm module so that the env vars can be made available in the execution context. Modify index.mjs to add the following

```javascript
import dotenv from 'dotenv'
dotenv.config()
```

- the sdk now can start using these settings

```bash
import {init, getConfig} from '@verify-media/verify-client'
init()
const config = getConfig()
console.log(config.STAGE)
```

- Since content gets uploaded to ipfs and then published to blockchain you would need the following:

  - a wallet funded with some matic. (_a private / public key pair required to sign transactions on the blockchain_)
  - [pinata](https://www.pinata.cloud/) (an ipfs service) credentials. (_storage for the content_)
  - a rpc url for the polygon testnet. (_allows for a developer to interact with an Ethereum node via HTTP(S)_)

  lets go ahead and set these up

- **Wallets**
  - verify protocol expects a publisher to have an [root identity](https://docs.verifymedia.com/publishing/identity/#registering-a-root-identity) and an [intermediate identity](https://docs.verifymedia.com/publishing/identity/#creating-a-intermediate-identity) which are represented by [wallets](https://ethereum.org/wallets)
  - if you don't have an wallet already, you could set one up using
    - [metamask](https://codehs.com/tutorial/jkeesh/how-to-set-up-an-ethereum-wallet-on-metamask) (_<b>Note: this is NOT recommended in production / mainnet environments</b>_)
    - OR gen-wallet script from the [examples folder](https://github.com/verify-media/verify-client/blob/main/example/README.md)
      ```bash
      npm run gen-wallet
      ```
      **you should now have a public / private key pair generated. Do keep the public key handy because that is the wallet address.**
- Copy private key and add it to .env against **ROOT_PVT_KEY**
- Repeat the same steps to add an intermediate wallet and configure the private key in .env against **PVT_KEY**

- Now that the wallets is created, add some funds to it.
  **Note: funds always need to be added to the intermediate wallet (public key) only**, since this is all on testnet (**not real money**) the intermediate wallet (_public key_) can be funded using one of the following faucets:

  - https://mumbaifaucet.com/
  - https://faucet.polygon.technology/
  - https://bwarelabs.com/faucets/polygon-testnet

  **to perform any steps on blockchain you would need some matic in your intermediate wallet.**

- You could check the funds in your intermediate wallet using
  - metamask
  - https://mumbai.polygonscan.com/ (add your address in the search bar and hit enter).
  - under examples folder
    ```bash
      npm run get-balance
    ```
- All of the content published on verify protocol are stored on IPFS, verify client sdk supports this via [pinata](https://www.pinata.cloud/) or your own IPFS cluster setup using [kubo](https://github.com/ipfs/kubo).
  For the purpose of this example lets setup a [free](https://www.pinata.cloud/pricing) pinata account. Configure the pinata api key and pinata secret add that to .env as

  ```bash
  PINATA_KEY=<PINATA_KEY>
  PINATA_SECRET=<PINATA_SECRET>
  ```

_Note: if the rpc url configured in this example fails you could pick any other https based rpc url from [here](https://chainlist.org/?search=mumbai&testnets=true)_

## Publishing

<b>Note: its important to follow the workflow mentioned in these 2 examples since it publishes content with a certain hierarchy which helps to maintain content provenance and context over a period of time</b>


- ### Setting up the publisher identities and org structure 
  #### prerequisite:
  - root wallet exists and is configured with sdk.
  - intermediate wallet exists and is configured with sdk.
  - intermediate wallet is funded.

  #### steps performed:
  - register root wallet on verify protocol.
  - link intermediate wallet with root wallet on verify protocol.
  - create orgNode and OriginalMaterialNode on verify protocol for the given publisher. This is a one time configuration for a publisher on the protocol, please update the orgNodeId and originalMaterialNodeId in the .env file for future use as follows

    ```bash
    ORG_NODE=<orgNodeId>
    OG_NODE=<ogNodeId>
    ```

  #### execute: 
  - env [setup](https://github.com/bclxyz/np-client/blob/master/example/README.md) for examples folder

    ```bash
    npm run init-publisher
    ```

  <i>checkout the script in ./examples/src/sdk/init.ts for each individual step</i>

- ### Publishing an article

  #### prerequisite:
  - orgNode exists and is passed as input.
  - OriginalMaterialNode exists and is passed as input.
  - intermediate wallet is funded.

  #### steps performed:
  - encrypt content.
  - upload content to ipfs if it does not exist on verify protocol already.
  - upload content meta to ipfs if its a new content or if metadata has changed for an existing content. (content metadata holds the location to actual content on ipfs).
  - sign content metadata.
  - publish on verify protocol <b>with the right hierarchy</b>


  #### execute: 
  env [setup](https://github.com/bclxyz/np-client/blob/master/example/README.md) for examples folder

  ```bash
  npm run publish-article <orgNodeId> <ogNodeId>
  # npm run publish-article 0x20601de6e456a9819d83f58573beaa49315dfd3af31bb030e4d85e19c3beb07f 0xeb6a6499ad57495ca0687e648821fe3b64df8a3c661eea30c2aed2f00eb1fdd8
  ```

  <i>checkout the script in ./examples/src/sdk/publish-article.ts for each individual steps</i>

## How to ?

you could refer the [examples](https://github.com/verify-media/verify-client/blob/main/example/README.md) folder demonstrating operations performed by the sdk.

## Content Hierarchy On Verify Protocol
TODO

## Known Issues

if you run in to issues while publishing try doing the following

```bash
npm uninstall siwe ethers
npm i siwe@2.0.5 --save
npm i ethers@5.7.0 --save
```
