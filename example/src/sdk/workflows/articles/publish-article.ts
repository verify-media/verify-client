import {
  getAssetDetails,
  init,
  publishArticle,
  version
} from '@verify-media/verify-client'
import dotenv from 'dotenv'
dotenv.config()
init()

const pretag = `verifymedia-client@${version} ===>`

const origin = process.env.ORG_NAME

if (!origin) throw new Error('ORG_NAME is not set')

function generateRandomString(len: number): string {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i: number = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

const articleId = generateRandomString(12)
const pubDate = new Date().toISOString()
const creditedSource = generateRandomString(15)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function getSingleImageUrl() {
  try {
    // Make a GET request to the Lorem Picsum API
    const response = await fetch('https://picsum.photos/400/500')

    // Check if the response is successful
    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }

    // Extract image URL from the response
    const imageUrl = response.url

    return imageUrl
  } catch (error) {
    console.error('Error fetching image URL:', error)

    return ''
  }
}

const imageUrl = await getSingleImageUrl()

const dummyArticle = {
  metadata: {
    title: generateRandomString(30),
    description: generateRandomString(60),
    uri: 'https://www.verifymedia.com/',
    origin: origin,
    datePublished: pubDate,
    dateCreated: pubDate,
    dateUpdated: pubDate,
    authority: { name: origin, contact: origin },
    id: articleId
  },
  contents: [
    {
      published: pubDate,
      type: 'image',
      contentType: 'image/jpg',
      description: generateRandomString(30),
      alt: generateRandomString(20),
      caption: generateRandomString(50),
      uri: imageUrl,
      creditedSource: creditedSource,
      authority: { name: origin, contact: origin },
      id: generateRandomString(10),
      ownership: 'licensed',
      licensedFrom: creditedSource,
      title: generateRandomString(30)
    },
    {
      published: pubDate,
      type: 'text',
      body: generateRandomString(300),
      contentType: 'text/html',
      description: generateRandomString(50),
      creditedSource: origin,
      authority: { name: origin, contact: origin },
      id: articleId,
      ownership: 'owned',
      licensedFrom: origin,
      title: generateRandomString(30),
      uri: 'https://www.verifymedia.com/'
    }
  ]
}

const pinataConfig = {
  pinataKey: process.env.PINATA_KEY || '',
  pinataSecret: process.env.PINATA_SECRET || ''
}

const orgNodeId = process.argv[2] || process.env.ORG_NODE_ID
const ogNodeId = process.argv[3] || process.env.OG_NODE_ID

if (!orgNodeId || !ogNodeId) {
  throw new Error('please pass org NodeId and Original Material NodeId')
}

//Note: get the orgNodeId and ogNodeId after execution init.ts
const assets = await publishArticle(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  dummyArticle,
  pinataConfig,
  {
    orgNodeId: orgNodeId,
    ogNodeId: ogNodeId
  }
)

console.log(`${pretag} waiting for 3 seconds`)
await new Promise((resolve) => setTimeout(resolve, 3000))

const assetDetailPromises = await assets.map(
  async (asset: { assetHash: string }) => {
    const assetDetails = getAssetDetails(asset.assetHash, '', pinataConfig)

    return assetDetails
  }
)

const assetDetails = await Promise.all(assetDetailPromises)
console.log(`${pretag} published asset details`)
console.log(assetDetails)

// const decryptAssetPromises = await assetDetails.map(async (asset) => {
//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   //@ts-ignore
//   const decAsset = await decrypt(asset, wallet.address, '', pinataConfig)

//   return decAsset
// })

// const decryptAssets = await Promise.all(decryptAssetPromises)

// console.log(`${pretag} decrypted assets`)
// console.log(decryptAssets)
