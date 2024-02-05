_Note: this example assumes publishing on testnet using a [sandbox](https://docs.verifymedia.com/smart-contracts/#sandbox) env_

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
  - a rpc url for the [polygon testnet](https://mumbai.polygonscan.com/). (_allows for a developer to interact with an Ethereum node via HTTP(S)_)

  lets go ahead and set these up

- **Wallets**
  - verify protocol expects a publisher to have an [root identity](https://www.pinata.cloud/) and an [intermediate identity](https://www.pinata.cloud/) which are represented by [wallets](https://ethereum.org/wallets)
  - if you don't have an wallet already, you could set one up using
    - [metamask](https://codehs.com/tutorial/jkeesh/how-to-set-up-an-ethereum-wallet-on-metamask)
    - OR gen-wallet script from the [examples folder](https://github.com/verify-media/verify-client/blob/main/example/README.md)
      ```bash
      npm run gen-wallet
      ```
      **you should now have a public / private key pair generated. Do keep the public key handy because that is the wallet address.**
- Copy private key and add it to .env against **ROOT_PVT_KEY**
- Repeat the same steps to add an intermediate wallet and configure the private key in .env against **PVT_KEY**

- Now that the wallets is created, add some funds.
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
- All of the assets published on verify protocol are stored on IPFS, verify client sdk supports this via [pinata](https://www.pinata.cloud/) or your own IPFS cluster setup using [kubo](https://github.com/ipfs/kubo).
  For the purpose of this example lets setup a [free](https://www.pinata.cloud/pricing) pinata account. Configure the pinata api key and pinata secret add that to .env as
  `bash
PINATA_KEY=<PINATA_KEY>
PINATA_SECRET=<PINATA_SECRET>
`

_Note: if the rpc url configured in this example fails you could pick any other https based rpc url from [here](https://chainlist.org/?search=mumbai&testnets=true)_

## How to ?

you could refer the [examples](https://github.com/verify-media/verify-client/blob/main/example/README.md) demonstrating operations performed by the sdk.

## Simple Publishing Example

- ### register root wallet

```javascript
import { registerRoot, init } from '@verify-media/verify-client'
import dotenv from 'dotenv'
dotenv.config()

init()
const resp = await registerRoot('my-org')
console.log(resp.transactionHash)
```

- ### register intermediate wallet

```javascript
import { register, init } from '@verify-media/verify-client'
import dotenv from 'dotenv'
dotenv.config()

init()
const resp = await register()
console.log(resp.transactionHash)
```

- ### publish asset

```javascript
import {
  init,
  hashData,
  encryptAsset,
  publish,
  uploadToPinata,
  signAssetNode,
  buildAssetPayload,
  addEncryptionData,
  addIPFSData,
  addSignatureData,
  verifyAsset
} from '@verify-media/verify-client'
import dotenv from 'dotenv'
dotenv.config()

const config = init()

const text = 'hello world'
const hash = hashData(text) //asset hash acts as the asset id

let asset = buildAssetPayload(hash)
asset.data.description = 'sandbox sample string'
asset.data.type = 'text/html'
asset.data.encrypted = true
asset.data.manifest.uri = 'https://verifymedia.com'
asset.data.manifest.title = 'sandbox sample title'
asset.data.manifest.creditedSource = 'verifymedia'
asset.data.manifest.signingOrg.name = 'MY_ORG'
asset.data.manifest.signingOrg.unit = 'MY_ORG'
asset.data.manifest.published = new Date().toISOString()

const blob = new Blob([text], { type: 'text/plain' })
const encryptedAsset = await encryptAsset({
  content: blob,
  contentHash: hash
})
asset = addEncryptionData(asset, encryptedAsset)

// upload the encrypted asset to ipfs
const ipfsAssetUri = await uploadToPinata({
  data: {
    name: 'sandbox sample enc text asset',
    body: new TextEncoder().encode(encryptedAsset.dataToEncryptHash) // since text needs to be converted to a blob
  },
  config: {
    pinataKey: process.env.PINATA_KEY,
    pinataSecret: process.env.PINATA_SECRET
  },
  type: 'asset'
})

asset = addIPFSData(asset, ipfsAssetUri?.IpfsHash || '')

const signature = await signAssetNode(asset.data)
asset = addSignatureData(asset, signature)

// upload the asset meta data to ipfs
const ipfsUri = await uploadToPinata({
  data: {
    name: 'sandbox sample string',
    body: asset
  },
  config: {
    pinataKey: process.env.PINATA_KEY,
    pinataSecret: process.env.PINATA_SECRET
  },
  type: 'meta'
})

const ZeroHash =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

resp = await publish(ZeroHash, {
  id: hash,
  uri: ipfsUri.IpfsHash || '',
  referenceOf: ZeroHash
})

console.log(resp.transactionHash)

const verifiedAsset = await verifyAsset(hash, asset)
console.log(verifiedAsset)
```

## Known Issues

if you run in to issues while publishing try doing the following

```bash
npm uninstall siwe ethers
npm i siwe@2.0.5 --save
npm i ethers@5.7.0 --save
```
