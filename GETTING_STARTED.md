_Note: this guide assumes publishing on testnet using a [sandbox](https://docs.verifymedia.com/smart-contracts/#sandbox) env_

## Configure

To start publishing the sdk needs to be configured with some settings. It can be done either by setting environment variables in the execution context or by passing it as parameters to init config function.

- Create a .env file at the root of `test-verifymedia-client` (created during [quick start](https://github.com/verify-media/verify-client/blob/main/README.md#quick-start)) project and add the following env variables

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

- We recommend installing [dotenv](https://www.npmjs.com/package/dotenv) npm module so that the env vars can be made available in the execution context. Modify index.mjs to add the following

```javascript
import dotenv from 'dotenv'
dotenv.config()
```

- The VERIFY client sdk now can start using these settings

```bash
import {init, getConfig} from '@verify-media/verify-client'
init()
const config = getConfig()
console.log(config.STAGE)
```

- Since content gets uploaded to ipfs and then published to blockchain you would need the following:

  - A wallet funded with matic. (_a private / public key pair required to sign transactions on the blockchain_)
  - [Pinata](https://www.pinata.cloud/) (an IPSF service) credentials. (_storage for the content_)
  - A rpc url for the polygon testnet. (_allows for a developer to interact with an Ethereum node via HTTP(S)_)

## Setup

- **Wallets**
  - VERIFY Protocol expects a publisher to have a [root identity](https://docs.verifymedia.com/publishing/identity/#registering-a-root-identity) and an [intermediate identity](https://docs.verifymedia.com/publishing/identity/#creating-a-intermediate-identity) which are represented by [wallets](https://ethereum.org/wallets)
  - If you don't have a wallet already, you could set one up using
    - [MetaMask](https://codehs.com/tutorial/jkeesh/how-to-set-up-an-ethereum-wallet-on-metamask) (_<b>Note: this is NOT recommended in production / Mainnet environments</b>_)
    - OR gen-wallet script from the [examples folder](https://github.com/verify-media/verify-client/blob/main/example/README.md)
      ```bash
      npm run gen-wallet
      ```
      **You should now have a public / private key pair generated. Do keep the public key handy because that is the wallet address.**
- Copy private key and add it to `.env` against `ROOT_PVT_KEY`
- Repeat the same steps to add an intermediate wallet and configure the private key in `.env` against `PVT_KEY`

- Now that the wallet is created, add funds to it.
  **Note: funds always need to be added to the intermediate wallet (public key) only**, since this is all on testnet (**not real money**) the intermediate wallet (_<b>public key</b>_) can be funded using one of the following faucets:

  - https://mumbaifaucet.com/
  - https://faucet.polygon.technology/
  - https://bwarelabs.com/faucets/polygon-testnet

  **To perform any steps on blockchain you need matic in your intermediate wallet.**

- You can check the funds in your intermediate wallet using
  - MetaMask
  - https://mumbai.polygonscan.com/ (add your address in the search bar and hit enter).
  - Under examples folder
    ```bash
      npm run get-balance
    ```
- All content published on VERIFY Protocol are stored on IPFS. VERIFY client sdk supports this via [Pinata](https://www.pinata.cloud/) or your own IPFS cluster setup using [Kubo](https://github.com/ipfs/kubo).
  For the purpose of this example we will set up a [free](https://www.pinata.cloud/pricing) Pinata account. Configure the Pinata API key and Pinata secret, and then add that to `.env` as

  ```bash
  PINATA_KEY=<PINATA_KEY>
  PINATA_SECRET=<PINATA_SECRET>
  ```

_Note: if the RPC URL configured in this example fails, you can pick any other https based RPC URLs from [here](https://chainlist.org/?search=mumbai&testnets=true)_

## Publishing

<b>Note: it's important to follow the workflow mentioned in these 2 examples since it publishes content with a certain hierarchy. This helps to maintain content provenance and context over a period of time.</b>


- ### Setting up the publisher identities and org structure 
  #### Prerequisite:
  - Root wallet exists and is configured with the VERIFY client sdk.
  - Intermediate wallet exists and is configured with VERIFY client sdk.
  - Intermediate wallet is funded.

  #### Steps Performed:
  1. Register root wallet on VERIFY Protocol.
  2. Link intermediate wallet with root wallet on VERIFY Protocol.
  3. Create `orgNode` and `OriginalMaterialNode` on VERIFY Protocol for the intended publisher. This is a one time configuration for a publisher on the protocol, please update the `orgNodeId` and `originalMaterialNodeId` in the `.env` file for future use as follows

    ```bash
    ORG_NODE=<orgNodeId>
    OG_NODE=<ogNodeId>
    ```

  #### Execute:
  - env [setup](https://github.com/bclxyz/np-client/blob/master/example/README.md) for examples folder

    ```bash
    npm run init-publisher
    ```

  <i>Checkout the script in `./examples/src/sdk/init.ts` for each individual step</i>

- ### Publishing an Article

  #### Prerequisite:
  - `orgNode` exists and is passed as input
  - `OriginalMaterialNode` exists and is passed as input
  - Intermediate wallet is funded

  #### Steps Performed:
  1. Encrypt content
  2. Upload content to IPFS if it does not exist on VERIFY Protocol
  3. Upload content meta to IPFS if it is new content, or if metadata has changed for an existing content. (_Note: content metadata holds the location to actual content on IPFS_).
  4. Sign content metadata
  5. Publish on VERIFY Protocol <b>with the correct hierarchy</b>


  #### execute: 
  env [setup](https://github.com/bclxyz/np-client/blob/master/example/README.md) for examples folder

  ```bash
  npm run publish-article <orgNodeId> <ogNodeId>
  # npm run publish-article 0x20601de6e456a9819d83f58573beaa49315dfd3af31bb030e4d85e19c3beb07f 0xeb6a6499ad57495ca0687e648821fe3b64df8a3c661eea30c2aed2f00eb1fdd8
  ```

  <i>Checkout the script in ./examples/src/sdk/publish-article.ts for each individual steps</i>

## Examples

* Refer to the [examples](https://github.com/verify-media/verify-client/blob/main/example/README.md) folder to see how operations are performed by the VERIFY client sdk.

## Content Hierarchy On Verify Protocol
[Workflow](https://github.com/verify-media/verify-client/blob/main/workflowtemplates/index.md)

## Troubleshooting

* If you run in to issues while publishing try doing the following

```bash
npm uninstall siwe ethers
npm i siwe@2.0.5 --save
npm i ethers@5.7.0 --save
```
