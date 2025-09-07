// Basic API test for GraphQL endpoint using supertest
const request = require('supertest');
const { createServer } = require('node:http');
const { createYoga } = require('graphql-yoga');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const gql = require('graphql-tag');
const fs = require('fs');
const path = require('path');

const typeDefs = gql(fs.readFileSync(path.join(process.cwd(), 'schema.graphql'), 'utf8'));
const { authors, blogs } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data.json'), 'utf8'));

const resolvers = {
  Query: {
    blogs: () => blogs,
    blog: (_, { id }) => blogs.find(b => b.id === id),
    authors: () => authors,
    author: (_, { id }) => authors.find(a => a.id === id),
  },
  Blog: {
    author: (blog) => authors.find(a => a.id === blog.authorId),
    labels: (blog) => blog.labels
  },
  Author: {
    blogs: (author) => blogs.filter(b => b.authorId === author.id)
  }
};

const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);
const yoga = createYoga({ schema });
const app = createServer(yoga);

describe('GraphQL API', () => {
  it('returns all blogs', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: '{ blogs { id title labels author { id name } } }'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.blogs.length).toBeGreaterThan(0);
    expect(res.body.data.blogs[0]).toHaveProperty('id');
    expect(res.body.data.blogs[0]).toHaveProperty('title');
  });

  it('returns all authors', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: '{ authors { id name age description blogs { id } } }'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.authors.length).toBeGreaterThan(0);
    expect(res.body.data.authors[0]).toHaveProperty('id');
    expect(res.body.data.authors[0]).toHaveProperty('name');
  });
});
