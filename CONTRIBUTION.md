**[WIP] this repository is under active development and hence not ready for contributions outside Blockchain Creative Labs (BCL)**

- [Compiling Typescript via Microbundle](#compiling-typescript-via-microbundle)
- [Development code](#development-code)
- [Testing via Jest](#testing-via-jest)
- [Linting via ESLint](#linting-via-eslint)
- [Formatting code via Prettier](#formatting-code-via-prettier)
- [Continuous Integration](#continuous-integration)
- [Git Hooks](#git-hooks)
- [Debugging](#debugging)
- [Managing versions via changesets](#managing-versions-via-changesets)
- [Generating API documentation](#generating-api-documentation)
- [Publishing to NPM](#publishing-to-npm)
- [Package manager](#package-manager)
- [Usage](#usage)

## Compiling Typescript via Microbundle

Typescript files are compiled via [Microbundle](https://github.com/developit/microbundle), there are two scripts (`build:dev` and `build:prod`)
Microbundle creates three bundles, `modern (es6)` `cjs` and `umd`. Also in the `exports` field in the package.json there are three keys:

- `development` - used by bundlers while developing
- `default` - es6 (module) build of the library
- `require` - Commonjs build of the library

## Development code

While in the development, you have access to a few expressions that will later be transformed via Microbundle.

`__DEV__` expression: Write code that will be stripped out from the production build.

This code:

```js
if (__DEV__) {
  //dev only code
}
```

Will generate:

```js
if (process.env.NODE_ENV !== 'production') {
  //dev only code
}
```

Which will later (in `production` mode) be resolved to:

```js
if (false) {
  //dev only code
}
```

And it will be removed from your `production` build.

There are also some other expressions that you can use:

- `__VERSION__` is replaced with the environment variable `PKG_VERSION` or with `package.json` `version` field.
- `__COMMIT_SHA__` is replaced with the short version of the git commit SHA from the HEAD.
- `__BUILD_DATE__` is replaced with the date of the commit from the HEAD.

## Testing via Jest

Jest is used for testing. You can write your tests in Typescript and they will be compiled via babel targeting the nodejs version that is running the tests. The testing environment is set to `node`.
I think there is no faster way to run typescript tests in jest.

The coverage threshold is set to `80%` globally.

One plugin is added to jest:

- `jest-watch-typeahead` (for filtering tests by file name or test name)

There are three tasks for running tests:

- `test` run all test and report code coverage
- `test:ci` is the same as `test` only optimized for CI (will not run in parallel)
- `test:watch` continuously run tests by watching some or all files

## Linting via ESLint

ESLint is set up with a few plugins:

- `@typescript-eslint/eslint-plugin` for linting Typescript.
- `eslint-plugin-jest` for linting Jest test files
- `eslint-plugin-prettier` for prettier integration
- `eslint-plugin-promise` for linting promises
- `eslint-plugin-tsdoc` for linting TypeScript doc comments conform to the TSDoc specification.

You can run ESLint via `lint` and `lint:check` scripts.

## Formatting code via Prettier

Prettier is set up not to conflict with `eslint`. You can run prettier via `format` and `format:check` scripts.

## Continuous Integration

Github actions are used for continuous integration and testing.

- CI

  - Run on `push` to all branches
  - Run on `pull request` to `main` and `develop` branches
  - Run tests on node versions 18
  - Lint source
  - Build source
  - Run tests
  - Add banner

- Release
  - Run on `push` to `main` branch
  - Run tests on node versions 18
  - Lint source
  - Build source
  - Run tests
  - Add banner
  - ~~generate code coverage~~
  - Consume changesets
    - Bump package versions
    - Generate changelog
    - Publish to npm
  - ~~generate API docs (from source code, only if the package is published)~~
  - ~~make a commit with new API docs~~

## Git Hooks

There is one git hook setup via [husky](https://www.npmjs.com/package/husky) package in combination with [lint-staged](https://www.npmjs.com/package/lint-staged). Before committing the files all staged files will be run through ESLint, Prettier and test cases.

## Managing versions via changesets

For maintaining package versions I'm using [changesets](https://github.com/changesets/changesets)

## Generating API documentation

You can generate API documentation from your source files via [typedoc](https://typedoc.org)(`npm gen:docs`).
Currently, documentation will be generated into `docs/api` directory, and it is generated in markdown, so it can be displayed on Github.

- Private class members are excluded
- Declarations with `@internal` are excluded
- Only exported properties are documented

## Publishing to NPM

Manual publishing is done via `npm release` this task will go through regular NPM publish steps and will call [`prepublishOnly` life cycle script](https://docs.npmjs.com/cli/v7/using-npm/scripts#life-cycle-scripts).

## Package manager

`.npmrc` has been set to bcl internal registry, please set up an auth token with permissions of read packages and authorise bcl org on the auth token.
