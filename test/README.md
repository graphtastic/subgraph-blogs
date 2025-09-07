# Test Suite for subgraph-blogs

This directory contains all automated tests for the subgraph-blogs project.

## Test Strategy
- All tests are written in JavaScript using [Jest](https://jestjs.io/) and [Supertest](https://github.com/ladjs/supertest).
- Tests use an in-memory instance of the GraphQL server for speed and isolation.
- No external server needs to be running to execute the tests.

## How to Run Tests
From the project root:

```sh
npm test
```

or to watch for changes:

```sh
npm run test:watch
```

## Adding Tests
- Place new test files in this directory.
- Use descriptive names and group related tests with `describe` blocks.
- Prefer integration-style tests that exercise the GraphQL API as a user would.

## Example
See `api.test.js` for a comprehensive example covering all major API features and error cases.
