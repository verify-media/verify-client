// Copyright 2023 Blockchain Creative Labs LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {
  Article,
  AssetNode,
  AssetNodeData,
  ContentTypes,
  LocationProtocol,
  MIME_TYPES,
  Signature
} from '../types/schema'
import { BigNumber, ethers } from 'ethers'

export const assetNode: AssetNodeData = {
  type: 'text/html',
  description: 'test description',
  encrypted: true,
  access: {
    'lit-protocol': {
      ciphertext:
        '69d7507bab3ea242903cd6ebde6aa58f8286164a738637423b2db6e7b10dcc6396c9f148e58722d74b7c560148826e189332164835e64efa49520b07aafa5bd2706ce5814c550fb52b62f16caefd309d69da79840a222cda27f908c8995a4a8f45f165a1d794388b4ace666f204861ccab32b8ac8304510466525d497b21ecfe00000000000000205b69ca73033c783779cd05c24cd88be924e455ff93eecf8c3e9bbbd8262ffca37bd5785013d17d6d8161640c89cbcfab'
    }
  },
  locations: [
    {
      protocol: LocationProtocol.IPFS,
      uri: 'ipfs://bafkreibffjveulscu6vpp7w6mdlsbha2zyyhdt6zgtafgldghsydcrz5xm'
    },
    {
      protocol: LocationProtocol.HTTPS,
      uri: 'https://npwf-dev-onchain/v2/0xc46c96f13a8a9f8b3ce4cf0a373d21fc6a9dee207a3d8935593d03e3bf41b0ea'
    }
  ],
  manifest: {
    uri: 'https://verifymedia.com',
    title: 'Dev2 test',
    description: 'test data',
    creditedSource: 'FOX',
    signingOrg: {
      name: 'FOX',
      unit: 'FOXNEWS'
    },
    published: '2023-11-09T20:59:31.000Z'
  },
  contentBinding: {
    algo: 'keccak256',
    hash: '0xc46c96f13a8a9f8b3ce4cf0a373d21fc6a9dee207a3d8935593d03e3bf41b0ea'
  }
}

const mockSignature: Signature = {
  curve: 'mockCurve',
  signature: 'mockSignature',
  message: 'mockMessage',
  description: 'mockDescription'
}

export const AssetNodeWithSign: AssetNode = {
  data: assetNode,
  signature: mockSignature
}

export const mockHighGasPrice = BigNumber.from(30000000000000)
export const mockLowGasPrice = BigNumber.from(100000000000)
export const mockDefaultGasPrice = BigNumber.from(2000000000000)
export const mockNoGasPrice = BigNumber.from(0)
export const mockNodesCreated = BigNumber.from(1)
export const mockUnit8Array = new Uint8Array([1, 2, 3, 4])

export const mockPinataResponse = {
  IpfsHash: 'mockIpfsHash',
  PinSize: 1,
  Timestamp: 'mockTimestamp'
}

export const mockNodeData = {
  token: BigNumber.from(1234),
  nodeType: '2',
  id: '0x0000000000000000000000000000000000000000000000000000000000000000',
  uri: 'ipfs://bafkreiau66agu7lrhbwmkupkbowb5qjm2ea3vcsp2galaljtoiznmxdb7e',
  referenceOf:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  accessAuth: '0x1234',
  referenceAuth: '0x5678'
}

export const mockTransactionResponse: ethers.providers.TransactionResponse = {
  hash: '0x1234',
  confirmations: 0,
  from: '0x1234',
  nonce: 0,
  gasLimit: BigNumber.from('0x1234'),
  gasPrice: BigNumber.from('0x1234'),
  data: '0x',
  value: BigNumber.from('0x1234'),
  chainId: 1,
  wait: jest.fn().mockImplementation(() =>
    Promise.resolve({
      to: '0x1234',
      from: '0x1234',
      contractAddress: '0x1234',
      transactionIndex: 0,
      gasUsed: BigNumber.from('0x1234'),
      logsBloom: '0x1234',
      blockHash: '0x1234',
      transactionHash: '0x1234',
      logs: [],
      blockNumber: 0,
      confirmations: 0,
      cumulativeGasUsed: BigNumber.from('0x1234'),
      byzantium: true,
      status: 1
    })
  )
}

export const PublishedAsset: AssetNode = {
  data: {
    description: 'sandbox sample string',
    type: 'image/jpg',
    encrypted: true,
    access: {
      'lit-protocol': {
        ciphertext:
          '0x530fd0f87ab05a6096e7eba481f4e8403bd174017d983d12d7d41af9b7d61abe'
      }
    },
    locations: [
      {
        protocol: LocationProtocol.IPFS,
        uri: 'ipfs://bafkreiau66agu7lrhbwmkupkbowb5qjm2ea3vcsp2galaljtoiznmxdb7e'
      }
    ],
    manifest: {
      uri: 'https://verifymedia.com',
      title: 'sandbox sample title',
      creditedSource: 'verifymedia',
      signingOrg: {
        name: 'FOX',
        unit: 'FOX'
      },
      published: '2023-12-20T14:14:48.310Z'
    },
    contentBinding: {
      algo: 'keccak256',
      hash: '0x530fd0f87ab05a6096e7eba481f4e8403bd174017d983d12d7d41af9b7d61abe'
    }
  },
  signature: {
    curve: 'sepc256k1',
    signature:
      '0xa6c587c44da488a416ac6086b58319c1d9b5a0f573548aa9f56ea429a1384ea6775be5230f2f156d684948b2cd01df49615e14141f547aed5bf394ef480261cc1b',
    message:
      '0x5d6d2fbfac7553bfb53f23cb84640f06c76667ad0754a3af17a097e2cb285346',
    description:
      'hex encoded sepc256k1 signature of the keccak256 hash of content field with the signers private key'
  }
}

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

const origin = 'test-origin'
export const mockArticle: Article = {
  metadata: {
    title:
      "Accused clerk in Murdaugh trial refutes bombshell jury tampering allegations, says case was 'a lot to juggle'",
    description:
      "FOX Nation's 'The Fall of the House of Murdaugh' pulls the curtain back on County Clerk Rebecca Hill following allegations of jury-tampering from the Murdaugh defense team.",
    uri: 'https://foxnews.com/media/accused-clerk-murdaugh-trial-refutes-bombshell-jury-tampering-allegations-case-lot-juggle',
    origin: origin,
    datePublished: new Date().toISOString(),
    dateCreated: '2023-09-28T18:53:03.000Z',
    dateUpdated: '2023-09-28T20:18:52.000Z',
    authority: { name: 'FOX', contact: origin },
    id: generateRandomString(12)
  },
  contents: [
    {
      published: new Date().toISOString(),
      type: ContentTypes.IMAGE,
      contentType: MIME_TYPES.JPG,
      description:
        "Accused clerk in Murdaugh trial refutes bombshell jury tampering allegations, says case was 'a lot to juggle'",
      alt: 'Rebecca Hill wearing a gray scarf and Alex Murdaugh in court.',
      caption:
        'A side by side of Colleton County Court Clerk Rebecca Hill and Alex Murdaugh in court for his double murder trial.',
      uri: 'https://static.foxnews.com/foxnews.com/content/uploads/2023/09/murdaugh-rebecca-hill.jpg',
      creditedSource: 'Jennifer Mitchell for Fox News Digital/ pool ',
      authority: { name: 'FOX', contact: origin },
      id: generateRandomString(12),
      title:
        "Accused clerk in Murdaugh trial refutes bombshell jury tampering allegations, says case was 'a lot to juggle'",
      metadata: {}
    },
    {
      published: new Date().toISOString(),
      type: ContentTypes.TEXT,
      body: `randomness ${generateRandomString(
        8
      )} <p>Convicted murderer<a href="https://www.foxnews.com/media" target="_blank"> Alex Murdaugh and his defense team</a> have requested a new trial following the bombshell jury tampering accusation against Colleton County Clerk Rebecca Hill. </p><p>In the days and weeks following the trial, Murdaugh's defense began hearing of jury tampering, but was unable to find a root to the rumors until shocking new evidence against Hill came to light. </p><p>The accused clerk shared her personal insights on the case, the trial, and even the jury in <a href="https://nation.foxnews.com/featured/?cmpid=org=NAT::ag=owned::mc=referral::src=FNC_web::cmp=Boiler::add=DigitalBoilerUnit_&amp;utm_source=referral&amp;utm_medium=FNC_web&amp;utm_campaign=Boiler&amp;utm_content=DigitalBoilerUnit_" target="_blank">FOX Nation's newest episode of "The Fall of the House of Murdaugh."</a></p><p><a href="https://www.foxnews.com/media/alex-murdaugh-extremely-angry-jury-tampering-allegations-considered-court-clerk-friend-lawyer-says" target="_blank"><strong>ALEX MURDAUGH 'EXTREMELY ANGRY' ABOUT JURY TAMPERING ALLEGATIONS, CONSIDERED COURT CLERK A FRIEND, LAWYER SAYS</strong></a></p><p> In June 2021, 55-year-old Alex Murdaugh was <a href="https://www.foxnews.com/us/convicted-killer-alex-murdaugh-sentenced-to-life-in-prison" target="_blank"><u>sentenced to two life terms</u></a> in prison in March for the fatal shooting of his wife, Maggie Murdaugh, and his son, Paul Murdaugh.</p><p>In Murdaugh's attorney's recent motion to the court, they cited "newly discovered evidence" obtained during conversations with two jurors, alleging that Court Clerk Rebecca Hill urged the panel to "reach a quick verdict" and that she had "frequent private conversations with the jury foreperson" to push them toward a guilty verdict.</p><p><a href="https://nation.foxnews.com/the-fall-of-the-house-of-murdaugh-nation/?cmpid=org=NAT::ag%5B%E2%80%A6%5Drticle&amp;utm_content=TheFallOfTheHouseOfMurdaugh_SeriesDetail" target="_blank"><strong>WATCH REBECCA HILL'S FOX NATION INTERVIEW ON ‘THE FALL OF THE HOUSE OF MURDAUGH’ HERE</strong></a></p><p>Hill hints at this in episode four of "The Fall of the House of Murdaugh," <a href="https://nation.foxnews.com/featured/?cmpid=org=NAT::ag=owned::mc=referral::src=FNC_web::cmp=Boiler::add=DigitalBoilerUnit_&amp;utm_source=referral&amp;utm_medium=FNC_web&amp;utm_campaign=Boiler&amp;utm_content=DigitalBoilerUnit_" target="_blank">which dropped earlier this week on FOX Nation</a>, saying that she believed it would only take the jury "45 minutes" to conclude that Murdaugh was guilty.</p><p>The <a href="https://www.foxnews.com/us/alex-murdaugh-lawyers-slam-court-clerks-illegal-behavior-they-push-new-trial" target="_blank"><u>defense team also alleged</u></a> that Hill presented false information to the judge to get a juror she thought was sympathetic to Murdaugh kicked off the panel, while accusing her of discussing Murdaugh's guilt with jurors and trying to coerce a conviction so that she could secure a book deal.</p><p><a href="https://www.foxnews.com/media/murdaugh-court-clerk-hinted-personal-relationships-murder-trial-prior-tampering-allegations" target="_blank"><strong>MURDAUGH COURT CLERK HINTED AT ‘PERSONAL RELATIONSHIPS’ DURING MURDER TRIAL, PRIOR TO TAMPERING ALLEGATIONS</strong></a></p><p>Hill is accused of getting one juror booted from the panel Feb. 28 on the eve of deliberations by falsely telling Judge Clifton Newman that the woman's ex-husband had accused her in a deleted Facebook post of talking about the case while drinking alcohol and revealing her plans to acquit Murdaugh. Hill even wrote about the incident in her book.</p><p>During her appearance in <a href="https://nation.foxnews.com/featured/?cmpid=org=NAT::ag=owned::mc=referral::src=FNC_web::cmp=Boiler::add=DigitalBoilerUnit_&amp;utm_source=referral&amp;utm_medium=FNC_web&amp;utm_campaign=Boiler&amp;utm_content=DigitalBoilerUnit_" target="_blank">FOX Nation's exclusive special</a>, Hill repeatedly expressed that the trial was extremely challenging to manage given the intensity of the crime and the amount of media attention it was receiving. </p><p>Despite the multitude of external factors that played major roles in the trial, Hill doubled down on Alex's conviction, arguing that he murdered his wife Maggie and son Paul in a "weird twisted way of love."</p><p>To hear County Clerk Rebecca Hill's exclusive side of the Murdaugh murder trial, subscribe to FOX Nation where you can start streaming "Episode 4: The Clerk in Question" now.<br><br><a href="https://nation.foxnews.com/featured/?cmpid=org=NAT::ag=owned::mc=referral::src=FNC_web::cmp=Boiler::add=DigitalBoilerUnit_&amp;utm_source=referral&amp;utm_medium=FNC_web&amp;utm_campaign=Boiler&amp;utm_content=DigitalBoilerUnit_" target="_blank"><strong>CLICK HERE TO JOIN FOX NATION</strong></a></p><p><i><strong>For more Culture, Media, Education, Opinion and channel coverage, visit </strong></i><a href="https://www.foxnews.com/media" target="_blank" rel="noopener noreferrer"><i><strong><u>foxnews.com/media.</u></strong></i></a></p><p><i><strong>Sign up today on Fox Nation to stream ‘</strong></i><a href="https://nation.foxnews.com/the-fall-of-the-house-of-murdaugh-nation/?cmpid=org=NAT::ag%5B%E2%80%A6%5Drticle&amp;utm_content=TheFallOfTheHouseOfMurdaugh_SeriesDetail" target="_blank"><i><strong><u>The Fall of the House of Murdaugh,</u></strong></i></a><i><strong>’ featuring Fox News' Martha MacCallum's exclusive interview with Alex Murdaugh's son, Buster and other key players in the case.</strong></i><br><br><i>FOX News' Yael Halon contributed to this report.</i></p>`,
      contentType: MIME_TYPES.TEXT,
      description:
        "FOX Nation's 'The Fall of the House of Murdaugh' pulls the curtain back on County Clerk Rebecca Hill following allegations of jury-tampering from the Murdaugh defense team.",
      creditedSource: 'FOX',
      authority: { name: 'FOX', contact: origin },
      id: generateRandomString(12),
      title:
        "Accused clerk in Murdaugh trial refutes bombshell jury tampering allegations, says case was 'a lot to juggle'",
      uri: 'foxnews.com/media/accused-clerk-murdaugh-trial-refutes-bombshell-jury-tampering-allegations-case-lot-juggle',
      metadata: {}
    }
  ]
}
