# VERIFY client examples

## Prerequisites

```javascript
"node": ">=18.15.0",
"npm": "9.5.0"
```

Other critical dependencies

```javascript
"siwe": "^2.0.5"
"ethers": "^5.7.0",
```

## Getting started

Install VERIFY client sdk

```bash
npm i @verify-media/verify-client
```

Or use [npm-link](#https://docs.npmjs.com/cli/v10/commands/npm-link) to use sdk build as a node module in the example app

```bash
git clone git@github.com:bclxyz/verify-client.git
cd verify-client
npm i
npm run build
npm link
cd example
npm link @verify-media/verify-client
touch .env
```

Your environment should now be setup to use the VERIFY client sdk build as a node module in the example app. Copy contents of `.env.test` to `.env` and set the following environment variables as mentioned in the following guide

# Setup

Please refer the [getting started](https://github.com/verify-media/verify-client/blob/public-release/GETTING_STARTED.md) guide.

## Examples

- ### Register the publisher and Init Org Structure

  ```bash
  npm run init-publisher
  ```

  This script registers the root and intermediate identities for a publisher and also initializes the org structure on VERIFY protocol. During this process and org node and original material node are created on the protocol. This is a one time configuration for a publisher on the protocol. Please update the `orgNodeId` and `originalMaterialNodeId` in the `.env` file for future use as follows:
  
- ### Publish an article

  ```bash
  npm run publish-article <orgNodeId> <ogNodeId>
  # npm run publish-article 0x20601de6e456a9819d83f58573beaa49315dfd3af31bb030e4d85e19c3beb07f 0xeb6a6499ad57495ca0687e648821fe3b64df8a3c661eea30c2aed2f00eb1fdd8
  ```

  This script demonstrates publishing of an article and its contents using a workflow such that content's provenance and usage context is always maintained while considering ownership and licenses.


## Other Scripts

- ### gen-wallet:

  Generates a set of public / private key pair

  ```bash
  npm run gen-wallet
  ```

- ### get-balance:
  Returns the balance of the wallet
  ```bash
  npm run get-balance
  ```

- ### transfer:
  Transfer some amount of ether from one wallet to another
  ```bash
  npm run transfer <to> <amount>
  ```
  Example:
  ```bash
  npm run transfer 0x20601de6e456a9819d83f58573beaa49315dfd3af31bb030e4d85e19c3beb07f 0.1
  ```

- ### org-nodes:
  Creates an org node and an original material node on the protocol for the configured root and intermediate identities
  ```bash
  npm run org-nodes
  ```

- ### read:
  Reads the content and hierarchy of an asset stored on the protocol
  ```bash
  npm run read <assetId>
  ```
  Example:
  ```bash
  npm run read 0x20601de6e456a9819d83f58573beaa49315dfd3af31bb030e4d85e19c3beb07f
  ```  

- ### children:
  Reads the content of all children nodes of the given node
  ```bash
  npm run children <nodeId>
  ```
  Example:
  ```bash
  npm run children 0x20601de6e456a9819d83f58573beaa49315dfd3af31bb030e4d85e19c3beb07f
  ```  

- ### status:
  Gets the status of the configured root and intermediate identities
  ```bash
  npm run status
  ```

- ### register-root:
  Registers the configured root identity on the protocol
  ```bash
  npm run register-root
  ```

- ### register:
  Registers and links the configured intermediate identity to the root identity on the protocol
  ```bash
  npm run register
  ```

- ### unregister-root:
  Unregisters the configured root identity on the protocol
  ```bash
  npm run unregister-root
  ```

- ### unregister:
  Unregisters and unlinks the configured intermediate identity to the root identity on the protocol
  ```bash
  npm run unregister
  ```

- ### publish:
  Demonstrates a simple publish of asset on the protocol. <b>Note: this is a simple publish, and does not maintain the provenance and usage context of the asset</b>
  ```bash
  npm run publish
  ```

- ### consume:
  Demonstrates a simple consumption of asset from the protocol. Reads the asset details from chain and then from IPFS also decrypts the content and writes it to a file
  ```bash
  npm run consume
  ```
