# verify client examples

## Prerequisites

```javascript
"node": ">=18.15.0",
"npm": "9.5.0"
```

other critical dependencies

```javascript
"siwe": "^2.0.5"
"ethers": "^5.7.0",
```

## Getting started

install the sdk

```bash
npm i @verifymedia/verify-client
```

or

use [npm-link](#https://docs.npmjs.com/cli/v10/commands/npm-link) to use sdk build as a node module in the example app

```bash
git clone git@github.com:bclxyz/verify-client.git
cd verify-client
npm i
npm run build
npm link
cd example
npm link @verifymedia/verify-client
touch .env
```

your environment should now be setup to use the sdk build as a node module in the example app. Copy contents of .env.test to .env and set the following environment variables as mentioned in the following guide

## Scripts

- ### gen-wallet:

  generates a set of public / pvt key pair

  ```bash
  npm run gen-wallet
  ```

- ### get-balance:
  returns the balance of the wallet
  ```bash
  npm run get-balance
  ```

# Setup

please refer the [getting started](https://github.com/verify-media/verify-client/blob/public-release/GETTING_STARTED.md) guide.

## Examples

- ### Register the root wallet

  ```bash
  npm run register-root
  ```

  this script registers the root wallet on the blockchain. This is a one time activity. Once the root wallet is registered, multiple intermediate wallets can be registered under the root wallet.

- ### Register intermediate wallet with the root wallet

  ```bash
  npm run register
  ```

  this script registers the intermediate wallet on the blockchain. This is a one time activity. Once the intermediate wallet is registered you can start publishing contnet using the intermediate wallet.

- ### Check status of wallets

  ```bash
  npm run status
  ```

  this script checks the status of the root wallet and the intermediate wallet

- ### Publish content

  ```bash
  npm run publish
  ```

  this script publishes content on the blockchain (in this example the content is encrypted using [lit protocol](https://www.litprotocol.com/))

- ### Verify content

  you need to pass an asset id to verify content, you could get the asset id from the publish script output

  ```bash
  npm run consume <asset_id>
  ```

  this script verifies content / also shows how to consume content from verify protocol (content is decrypted using [lit protocol](https://www.litprotocol.com/))

**_please explore the /src folder for more examples_**
