module.exports = {
  $schema: 'https://typedoc.org/schema.json',
  theme: 'default',
  readme: 'none',
  excludePrivate: true,
  excludeInternal: true,
  excludeProtected: true,
  exclude: ['./src/__tests__', 'node_modules', '**/node_modules/**/*'],
  out: 'docs',
  skipErrorChecking: true,
  entryPoints: [
    './src/write/index.ts',
    './src/write/publish-templates.ts',
    './src/read/index.ts',
    './src/storage/ipfs/index.ts',
    './src/storage/ipfs/types/index.ts',
    './src/storage/pinata/index.ts',
    './src/storage/pinata/types/index.ts',
    './src/encryption/lit/index.ts',
    './src/encryption/lit/types/index.ts',
    './src/graph/identity/index.ts',
    './src/graph/identity/types/index.ts',
    './src/graph/protocol/index.ts',
    './src/graph/protocol/types/index.ts',
    './src/types/app.ts',
    './src/types/schema.ts',
    './src/utils/config.ts'
  ]
}
