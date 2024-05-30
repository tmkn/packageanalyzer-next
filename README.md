# packagenalyzer-next

This is a monorepo using turbo.

## Monorepo setup

The cli app is in `apps/cli`.

The core functionality of the packageanalyzer is in the `packages` folder:

-   `@packagenalyzer/shared` contains functionality that can be used in node and the browser
-   `@packagenalyzer/node` contains node specific functionality

The (shared) typescript config is in `tooling/tsconfig`.

Testing is done with `vitest`.

## Tests

### Running tests

`npm run test`

### Code Coverage

`npm run tst:coverage`

## Dev Setup

### Installing dependencies

`npm install`

### Building the project

`npm run build`

### Watch mode

`npm run dev`
