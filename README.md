# verify client sdk

[![Release][gha-badge]][gha-ci] [![TypeScript version][ts-badge]][typescript-5-0]
[![License: Apache 2.0][license-badge]][license]

[gha-ci]: https://github.com/verify-media/verify-client/actions/workflows/release.yml
[gha-badge]: https://github.com/verify-media/verify-client/actions/workflows/release.yml/badge.svg
[ts-badge]: https://img.shields.io/badge/TypeScript-5.0-blue.svg
[typescript-5-0]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/
[license-badge]: https://img.shields.io/badge/license-Apache_2.0-blue.svg
[license]: https://github.com/superical/ethers-decode-error/blob/main/LICENSE


## What is VERIFY?

VERIFY aims to be the central repository for content license and provenance, equipping the world with a backend to verify the source and license of digital content.

VERIFY is a public library of signed digital assets with capabilities that allow for a single DRM solution for digital assets. Every asset stored in VERIFY is signed by a real world entity that attests to the provenance of the asset. The publisher declares the asset’s license for access and reference through a smart contract module.

[verify-media/verify-client](https://www.npmjs.com/org/verify-media/verify-client) is a typesafe sdk for interacting with the [verify protocol](https://www.verifymedia.com/). It is written in typescript and is compiled to es6, cjs and umd bundles.

## Quick Start

- Verify client sdk supports javascript, start by installing [nodejs](https://nodejs.org/en) version 18 or higher.
- Verify the node version `node --version` on your terminal, sdk requires
  ```javascript
  "node": ">=18.15.0",
  "npm": "9.5.0"
  ```
- Setup a test project

  ```bash
  mkdir test-verifymedia-client
  cd test-verifymedia-client
  npm init -y
  touch index.mjs
  npm i @verify-media/verify-client
  ```

- Open this test-verifymedia-client/index.mjs in your favorite IDE and add the following snippet

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
  Congratulations you have the sdk up and running!!!

## Getting started

Please check the [getting started](https://github.com/verify-media/verify-client/blob/main/GETTING_STARTED.md) guide to start using the sdk.

## Examples

The repository hosts various [examples](https://github.com/verify-media/verify-client/tree/master/example) of how to use the sdk.

## Tech Docs

For the most up to date API documentation, check out the [verify-client sdk docs](https://probable-adventure-1w929yl.pages.github.io/)

the sdk offers methods to interact with the verify - some of the methods are as follows:

- [`init`](#init)
- [`getConfig`](#getConfig)
- [`registerRoot`](#registerRoot)
- [`unregisterRoot`](#unregisterRoot)
- [`register`](#register)
- [`unregister`](#unregister)
- [`encryptAsset`](#encryptAsset)
- [`uploadToPinata`](#uploadToPinata)
- [`fetchFileFromPinata`](#fetchFileFromPinata)
- [`signAssetNode`](#signAssetNode)
- [`publish`](#publish)
- [`getNode`](#getNode)
- [`decryptAsset`](#decryptAsset)
- [`verifyAsset`](#verifyAsset)

- ## `init`

  - This method is used to initialize the sdk, you can either set env vars or pass a config object. **This function needs to be called before performing any sdk action**. Here's an example of how to use it:

    ```javascript
    import { init } from '@verify-media/verify-client'

    init({
      debug: false,
      stage: STAGE.testnet,
      pvtKey: privateKey,
      rpcUrl: rpcUrl,
      chainId: chainId,
      chain: chain,
      maxGasPrice: ethers.utils.parseUnits('3000', 'gwei').toNumber()
    })
    ```

    _to test the sdk in sandbox env pass following env vars to the runtime where this sdk is running_

    ```sh
    .env file

    DEBUG=0
    RPC_URL=<polygon-mumbai rpc url>
    STAGE=testnet
    CHAIN_ID=80001
    CHAIN=mumbai
    MAX_GAS_PRICE=30000000000
    ROOT_PVT_KEY=<root pvt_key>
    PVT_KEY=<intermediate pvt_key>
    WALLET_EXPIRY_DAYS=3
    ```

    if env vars are set your could call init without any params

    ```javascript
    import { init } from '@verify-media/verify-client'

    init()
    ```

- ## `getConfig`

  - This method is used to fetch sdk config. Here's an example of how to use it:

    ```javascript
    import { getConfig } from '@verify-media/verify-client'

    const { chainId } = await getConfig()
    ```

- ## `registerRoot`

  - This method is used to register a root wallet in the system. Here's an example of how to use it:

    ```javascript
    import { registerRoot } from '@verify-media/verify-client'
    await registerRoot(orgName)
    ```

    - ref: `examples/src/identity-ops/register-root.ts`

    ```bash
      cd example && npm run register-root
    ```

- ## `unregisterRoot`

  - This method is used to unregister a root wallet in the system. Here's an example of how to use it:

    ```javascript
    import { unregisterRoot } from '@verify-media/verify-client'
    await unregisterRoot(rootPvtKey)
    ```

    - ref: `examples/src/identity-ops/unregister-root.ts`

    ```bash
      cd example && npm run unregister-root
    ```

- ## `register`

  - This method is used to register a intermediate wallet (signer wallet) in the system. Here's an example of how to use it:

    ```javascript
    import { register } from '@verify-media/verify-client'
    await register()
    ```

    - ref: `examples/src/identity-ops/register.ts`

    ```bash
      cd example && npm run register
    ```

- ## `unregister`

  - This method is used to unregister a intermediate wallet (signer wallet) in the system. Here's an example of how to use it:

    ```javascript
    import { unregister } from '@verify-media/verify-client'
    await unregister()
    ```

    - ref: `examples/src/identity-ops/unregister.ts`

    ```bash
      cd example && npm run unregister
    ```

- ## `encryptAsset`

  - This method is used to encrypt an asset . Here's an example of how to use it:

    ```javascript
    import { encryptAsset } from '@verify-media/verify-client'
    const encryptedAsset = await encryptAsset({
      content: blob,
      contentHash: hash
    })
    ```

    - ref: `examples/src/content-ops/encrypted/publish.ts`

    ```bash
      cd example && npm run publish
    ```

- ## `uploadToPinata`

  - This method is used to upload an asset to [pinata](https://www.pinata.cloud/) (an ipfs service) . Here's an example of how to use it:

    ```javascript
    import { uploadToPinata } from '@verify-media/verify-client'
    await uploadToPinata({
      data: {
        name: 'sandbox sample asset',
        body: encoder.encode(encryptedAsset.dataToEncryptHash)
      },
      config: {
        pinataKey: process.env.PINATA_KEY || '',
        pinataSecret: process.env.PINATA_SECRET || ''
      },
      type: 'asset'
    })
    ```

    - ref: `examples/src/content-ops/encrypted/publish.ts`

    ```bash
      cd example && npm run publish
    ```

- ## `fetchFileFromPinata`

  - This method is used to fetch an asset from [pinata](https://www.pinata.cloud/) (an ipfs service) . Here's an example of how to use it:

    ```javascript
    import { fetchFileFromPinata } from '@verify-media/verify-client'
    await fetchFileFromPinata(uri, 'meta')
    ```

    - ref: `examples/src/content-ops/encrypted/consume.ts`

    ```bash
      cd example && npm run consume
    ```

- ## `signAssetNode`

  - This method is used to sign an asset node . Here's an example of how to use it:

    ```javascript
    import { signAssetNode } from '@verify-media/verify-client'
    const signedAssetNode = await signAssetNode(assetNode.data)
    ```

    - ref: `examples/src/content-ops/encrypted/publish.ts`

    ```bash
      cd example && npm run publish
    ```

- ## `publish`

  - This method is used to publish an asset node to polygon. Here's an example of how to use it:

    ```javascript
    import { publish } from '@verify-media/verify-client'
    await publish(parentNode, {
      assetId: assetHash,
      assetUri: assetIpfsUri,
      referenceOf: refNode
    })
    ```

    - ref: `examples/src/content-ops/encrypted/publish.ts`

    ```bash
      cd example && npm run publish
    ```

- ## `getNode`

  - This method is used to get node data from polygon. Here's an example of how to use it:

    ```javascript
    import { getNode } from '@verify-media/verify-client'
    await getNode(assetHash)
    ```

    - ref: `examples/src/content-ops/encrypted/consume.ts`

    ```bash
      cd example && npm run consume
    ```

- ## `decryptAsset`

  - This method is used to decrypt an asset. Here's an example of how to use it:

    ```javascript
    import { decryptAsset } from '@verify-media/verify-client'
    const decryptedAsset = await decryptAsset({
        ciphertext
        dataToEncryptHash,
        contentHash: assetHash
      })
    ```

    - ref: `examples/src/content-ops/encrypted/consume.ts`

    ```bash
      cd example && npm run consume
    ```

- ## `verifyAsset`

  - This method is used to verify an asset. Here's an example of how to use it:

    ```javascript
    import { verifyAsset } from '@verify-media/verify-client'
    await verifyAsset(assetHash, assetNode)
    ```

    - ref: `examples/src/content-ops/encrypted/consume.ts`

    ```bash
      cd example && npm run consume
    ```

## License

Apache License Version 2.0
