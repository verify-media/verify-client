The Verify protocol leverages [ERC6150](https://eips.ethereum.org/EIPS/eip-6150) to introduce a multi-layered, hierarchical structure for managing Non-Fungible Tokens (NFTs) in a manner similar to a filesystem. This hierarchical approach enables the organization of content to uphold its context, provenance, and usage integrity over time.

Various workflows can be employed to cater to different use cases. Here, we outline the provenance workflow

## Example

Let's consider the case of a publisher, News24X7 wants to license and distribute original content via the Verify protocol.

_<b>Note: asset ownership has to be informed in the article payload by the publisher using the field ownership: [ref](https://probable-adventure-1w929yl.pages.github.io/types/types_schema.ContentMetadata.html)</b>_

### Setting up the publisher identities and org structure

Following the steps outlined in the [getting started](https://github.com/verify-media/verify-client/blob/main/GETTING_STARTED.md) guide the initial phase involves setting up publisher identities and the organizational node.

### Publishing an article

Let's consider an article comprising two image assets and a video asset along with associated metadata. The workflow entails:

### step 1

The pipeline would consider all assets presented in the payload which in this case means 2 image assets and 1 video asset.

### step 2

Each asset is processed to generate assetHash and cid. The assetHash is used to create an asset node on the protocol, while the cid is added to asset manifest.

### step 3

Asset metadata is signed with an intermediate wallet linked to publishers root wallet and uploaded to IPFS. Please note asset it self is not uploaded to IPFS.

### step 4

The assets are published on the Verify protocol following a hierarchical structure:

<b>orgNode / LicenseTypeNode / AssetTypeNode / Asset</b>

For example, an image asset owned by News24X7 needs to be published under public license, then the hierarchy would be:

<b>hash(orgNode) / hash(public) / hash(image) / hash(asset data)</b>

### step 5

Finally the license mentioned in the payload is applied to the published asset node.

<img src="./image.png" width="600" height="200">
