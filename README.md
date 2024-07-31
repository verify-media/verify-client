# verify client sdk

[![Release][gha-badge]][gha-ci] [![TypeScript version][ts-badge]][typescript-5-0]
[![License: Apache 2.0][license-badge]][license]

[gha-ci]: https://github.com/verify-media/verify-client/actions/workflows/release.yml
[gha-badge]: https://github.com/verify-media/verify-client/actions/workflows/release.yml/badge.svg
[ts-badge]: https://img.shields.io/badge/TypeScript-5.0-blue.svg
[typescript-5-0]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
[license-badge]: https://img.shields.io/badge/license-Apache_2.0-blue.svg
[license]: https://github.com/superical/ethers-decode-error/blob/main/LICENSE

VERIFY aims to be the central repository for content license and provenance, equipping the world with a backend to verify the source and license of digital content.

VERIFY is a public library of signed digital assets with capabilities that allow for a single DRM solution for digital assets. Every asset stored in VERIFY is signed by a real world entity that attests to the provenance of the asset. The publisher declares the asset’s license for access and reference through a smart contract module.

[verifymedia/client](https://www.npmjs.com/package/@verify-media/verify-client) is a typesafe sdk for interacting with the [verify protocol](https://www.verifymedia.com/). It is written in typescript and is compiled to es6 and cjs bundles ensuring compatibility with nodejs.

## Network
VERIFY Protocol is deployed on an Polygon CDK validium based appchain. 

```
Network Name: VERIFY Testnet
RPC URL: https://rpc.verify-testnet.gelato.digital
Chain ID: 1833
Currency Symbol: MATIC
Block Explorer URL: https://verify-testnet.blockscout.com/
Settlement Layer: Amoy 
```

more details can be found [here](https://docs.verifymedia.com/verify-testnet).

## Content Licensing

Each node in the ContentGraph can have a license specified for access and for reference. These licenses are smart contracts and hence can be programmatically enforced as per publisher needs.

more details can be found [here](https://docs.verifymedia.com/licensing).


## Quick Start

- Since VERIFY client sdk supports javascript, start by installing [nodejs](https://nodejs.org/en) version 18 or higher.
- Confirm the node version `node --version` in your terminal.

  sdk requires:
    ```javascript
    "node": ">=18.15.0",
    "npm": "9.5.0"
    ```
- Set up a test project

  ```bash
  mkdir test-verifymedia-client
  cd test-verifymedia-client
  npm init -y
  touch index.mjs
  npm i @verify-media/verify-client
  ```

- Open `test-verifymedia-client/index.mjs` in your favorite IDE and add the following snippet

  ```javascript
  import { hashData } from '@verify-media/verify-client'
  console.log(hashData('hello world'))
  ```

- Head over to the terminal (within vscode or your favorite terminal which has the nodejs env setup) and try executing
  ```bash
  node index.mjs
  ```
  you should see some output like
  ```bash
  0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad
  ```
  the sdk is up and running now.

## Getting started

Please check the [getting started](https://github.com/verify-media/verify-client/blob/main/GETTING_STARTED.md) guide to start using the sdk.

## Examples

The repository hosts various [examples](https://github.com/verify-media/verify-client/tree/main/example) of how to use the sdk.

## Tech Docs

For the most up-to-date API documentation, check out the [verify-client sdk docs](https://sdk.verifymedia.com/)


## License

Apache License Version 2.0

## Known Issues
This sdk uses node-fetch version 3.x which is esm compatible only. Hence to use this sdk the consumer application should ideally be esm compatible as well. To do this, the consumer application should have `"type": "module"` in its package.json file. If using typescript, the tsconfig.json should have `"module": "ESNext"` and `"moduleResolution": "node"`.