// Enable verbose Yoga logging if YOGA_DEBUG is set
if (process.env.YOGA_DEBUG) process.env.DEBUG = process.env.YOGA_DEBUG;
import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';

import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import fs from 'fs';
import path from 'path';

// Load schema from file
const typeDefs = gql(fs.readFileSync(path.join(process.cwd(), 'schema.graphql'), 'utf8'));

// Load authors and blogs as separate arrays from data.json
const { authors, blogs } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data.json'), 'utf8'));

// GraphQL resolvers map schema fields to data and logic
//
// Understanding the pattern: authors.find(a => a.id === id)
//
// - The => is the arrow function syntax in JavaScript/TypeScript. It defines an anonymous function.
//   Example: a => a.id === id is equivalent to function(a) { return a.id === id; }
//
// - The === is the strict equality operator. It checks that both value and type are equal (no type coercion).
//   Example: '2' === 2 is false, but 2 === 2 is true.
//
// - .find() is a built-in array method that takes a function (predicate) and returns the first element for which the function returns true.
//
// - So, authors.find(a => a.id === id) searches the authors array for an author object whose id property matches the id argument exactly.
//   If a match is found, that author object is returned; if not, .find() returns undefined.
//
// Example:
//   authors = [ { id: '1', name: 'Ada' }, { id: '2', name: 'Grace' } ]
//   id = '2'
//   authors.find(a => a.id === id) // returns { id: '2', name: 'Grace' }
//
// This pattern is used for both authors and blogs to efficiently look up a single item by its unique id.
const resolvers = {
  Query: {
    // Returns all blogs in the system as an array.
    blogs: () => blogs,

    // Returns a single blog by its unique id.
    blog: (_, { id }) => blogs.find(b => b.id === id),

    // Returns all authors in the system as an array.
    authors: () => authors,

    // Returns a single author by their unique id.
    author: (_, { id }) => authors.find(a => a.id === id),
  },
  Blog: {
    // Return the author for a blog
    author: (blog) => authors.find(a => a.id === blog.authorId),
    // Return the labels for a blog
    labels: (blog) => blog.labels
  },
  Author: {
    // Return all blogs for an author
    blogs: (author) => blogs.filter(b => b.authorId === author.id)
    // name, age, description are resolved automatically
  }
};

// Build the schema with federation support
const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

// Add logging plugin for Yoga to log every incoming GraphQL query and variables
const yoga = createYoga({
  schema,
  plugins: [
    {
      async onRequest({ request }) {
        if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
          try {
            const body = await request.json();
            console.info('--- Incoming GraphQL Request ---');
            if (body.operationName) console.info('Operation:', body.operationName);
            if (body.query) console.info('Query:', body.query);
            if (body.variables) console.info('Variables:', body.variables);
            console.info('-------------------------------');
          } catch (e) {
            // Ignore parse errors
          }
        }
      },
      onExecute({ args }) {
        // Fallback logging for non-JSON or GET requests
        const { document, variableValues, operationName } = args;
        if (document) {
          console.info('--- Incoming GraphQL Request (onExecute) ---');
          if (operationName) console.info('Operation:', operationName);
          if (document.loc && document.loc.source.body) console.info('Query:', document.loc.source.body);
          if (variableValues) console.info('Variables:', variableValues);
          console.info('-------------------------------');
        }
      }
    }
  ]
});

const server = createServer(yoga);
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.info(`Blogs subgraph running at http://localhost:${PORT}/graphql`)
});
