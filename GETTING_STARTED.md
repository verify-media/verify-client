_Note: this guide assumes publishing on [Polygon Testnet](https://docs.verifymedia.com/verify-testnet) using [sandbox environment](https://docs.verifymedia.com/smart-contracts#sandbox-environment) env . Using testnet or mainnet requires a whitelist from the VERIFY team. Please reach out to [VERIFY](https://verifymedia.com/) for more information._

## Configure

To start publishing the sdk needs to be configured with some settings. It can be done either by setting environment variables in the execution context or by passing it as parameters to init config function.

- Create a .env file at the root of `test-verifymedia-client` (created during [quick start](https://github.com/verify-media/verify-client/blob/main/README.md#quick-start)) project and add the following env variables

```bash
DEBUG=0 # 0 if false and 1 is true with default false. When true print debug logs
RPC_URL=https://rpc-amoy.polygon.technology # allows for a developer to interact with an Ethereum node via HTTP(S)
STAGE=sandbox # stage of the VERIFY Protocol
CHAIN_ID=80002 # chain id for the network
CHAIN=amoy # network name
MAX_GAS_PRICE=0 #if set a transaction will not be performed if network gas is above this limit
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
console.log(config.stage)
```

- Since content gets uploaded to ipfs and then published to blockchain you would need the following:

  - A wallet funded with at least 0.1 matic. (_a private / public key pair required to sign transactions on the blockchain_)
  - [Pinata](https://www.pinata.cloud/) (an IPSF service) credentials. (_storage for the content_)
  
## Setup

- **Wallets**
  - VERIFY Protocol expects a publisher to have a [root identity](https://docs.verifymedia.com/publishing/identity/#registering-a-root-identity) and an [intermediate identity](https://docs.verifymedia.com/publishing/identity/#creating-a-intermediate-identity) which are represented by [wallets](https://ethereum.org/wallets)
  - If you don't have a wallet already, you could set one up using
    - [MetaMask](https://codehs.com/tutorial/jkeesh/how-to-set-up-an-ethereum-wallet-on-metamask) (_<b>Note: this is NOT recommended in production / mainnet environments</b>_)
    - OR gen-wallet script from the [examples folder](https://github.com/verify-media/verify-client/blob/main/example/README.md)
      ```bash
      npm run gen-wallet
      ```
      **You should now have a public / private key pair generated. Do keep the public key handy because that is the wallet address.**
- Copy private key and add it to `.env` against `ROOT_PVT_KEY`
- Repeat the same steps to add an intermediate wallet and configure the private key in `.env` against `PVT_KEY`

- Now that the wallet is created, add funds to it.
  **Note: funds always need to be added to the intermediate wallet (public key) only**, since this is all on testnet (**not real money**). The intermediate wallet (_<b>public key</b>_) can be funded using Polygon Faucet, more details on funding your wallet can be found [here](https://docs.verifymedia.com/verify-testnet#using-the-verify-testnet-network).

- All content published on VERIFY Protocol is stored on IPFS. VERIFY client sdk supports this via [Pinata](https://www.pinata.cloud/) or your own IPFS cluster setup using [Kubo](https://github.com/ipfs/kubo).
  For the purpose of this example please set up a [free](https://www.pinata.cloud/pricing) Pinata account. Configure the Pinata API key and Pinata secret, and then add that to `.env` as

  ```bash
  PINATA_KEY=<PINATA_KEY>
  PINATA_SECRET=<PINATA_SECRET>
  ```

- Finally please set the ORG_NAME in the `.env` file to the name of the publisher

## Publishing

To run these examples please follow the env [setup](https://github.com/verify-media/verify-client/blob/main/example/README.md) for examples folder

<b>Note: The examples provided below illustrate a specific workflow for publishing content. The Verify protocol does not endorse any particular workflow; publishers are free to implement processes based on their individual requirements. The following example is intended to showcase one possible workflow.</b>


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
  - env [setup](https://github.com/verify-media/verify-client/blob/main/example/README.md) for examples folder

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
  env [setup](https://github.com/verify-media/verify-client/blob/main/example/README.md) for examples folder

  ```bash
  npm run publish-article <orgNodeId> <ogNodeId>
  # npm run publish-article 0x20601de6e456a9819d83f58573beaa49315dfd3af31bb030e4d85e19c3beb07f 0xeb6a6499ad57495ca0687e648821fe3b64df8a3c661eea30c2aed2f00eb1fdd8
  ```

  <i>Checkout the script in ./examples/src/sdk/publish-article.ts for each individual steps</i>

## Examples

* Refer to the [examples](https://github.com/verify-media/verify-client/blob/main/example/README.md) folder to see how operations are performed by the VERIFY client sdk.

## Workflow templates
The Verify protocol leverages [ERC6150](https://eips.ethereum.org/EIPS/eip-6150) to introduce a multi-layered, hierarchical structure for managing Non-Fungible Tokens (NFTs) in a manner similar to a filesystem. This hierarchical approach enables the organization of content to uphold its context, provenance, and usage integrity over time.

Various workflows can be employed to cater to different use cases. Here, we outline the workflow utilized in this SDK for content publishing.

[AuditTrail](https://github.com/verify-media/verify-client/blob/main/workflowtemplates/index.md)

