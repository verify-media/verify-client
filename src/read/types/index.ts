type ContentLocation = {
  uri: string
  protocol: string
}

type ContentAccess = {
  [key: string]: {
    version: string
  }
}

type ContentManifest = {
  uri: string
  title: string
  alt: string
  description: string
  caption: string
  creditedSource: string
  signingOrg: {
    name: string
    unit: string
  }
  published: string
}

type ContentContentBinding = {
  algo: string
  hash: string
}

type ContentMeta = {
  description: string
  type: string
  encrypted: boolean
  access: ContentAccess
  locations: ContentLocation[]
  manifest: ContentManifest
  contentBinding: ContentContentBinding
}

type ContentSignature = {
  curve: string
  signature: string
  message: string
  description: string
}

export type Content = {
  assetId: string
  meta: {
    data: ContentMeta
    signature: ContentSignature
  }
  type: string
  location: string
  orgStruct: string[]
}

type ArticleHeader = {
  title: string
  description: string
  datePublished: string
  id: string
  canonicalUrl: string
  publishedBy: string
}

type ArticleContents = {
  Content: Content[]
}

export type Article = {
  header: ArticleHeader
  main: {
    section: string
  }
  contents: ArticleContents
  orgStruct: string[]
}
