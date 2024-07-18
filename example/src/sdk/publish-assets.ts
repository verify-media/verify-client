import {
  LICENSE_TYPES,
  init,
  publishAssets,
  ContentTypes,
  MIME_TYPES,
  getAssetDetails
} from '@verify-media/verify-client'
import dotenv from 'dotenv'

dotenv.config()
init()
const pinataConfig = {
  pinataKey: process.env.PINATA_KEY || '',
  pinataSecret: process.env.PINATA_SECRET || ''
}

const orgNodeId = process.env.ORG_NODE

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

const mode = process.argv[2]

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

if (mode !== 'read') {
  try {
    const origin = process.env.ORG_NAME

    if (!origin) throw new Error('ORG_NAME is not set')

    const imageUrl1 = await getSingleImageUrl()
    // const imageUrl2 = await getSingleImageUrl()

    const dummyAssets = [
      {
        published: pubDate,
        type: ContentTypes.IMAGE,
        contentType: MIME_TYPES.JPEG,
        description: generateRandomString(30),
        alt: generateRandomString(20),
        caption: generateRandomString(50),
        uri: imageUrl1,
        creditedSource: creditedSource,
        authority: { name: origin, contact: origin },
        id: generateRandomString(10),
        title: generateRandomString(30)
      }
    ]

    if (!orgNodeId) {
      throw new Error('please pass org NodeId')
    }

    const assets = await publishAssets(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      dummyAssets,
      pinataConfig,
      orgNodeId,
      LICENSE_TYPES.authorizer
    )

    assets.map(async (asset: { assetHash: string }) => {
      const assetDetails = await getAssetDetails(
        asset.assetHash,
        '',
        pinataConfig
      )

      console.log(JSON.stringify(assetDetails, null, 2))
      delay(1000)
    })
  } catch (e) {
    console.log(e)
  }
} else {
  try {
    console.log('read mode')
    const assetId = process.argv[3]
    const assetDetails = await getAssetDetails(assetId, '', pinataConfig)
    console.log(JSON.stringify(assetDetails, null, 2))
  } catch (e) {
    console.log(e)
  }
}
