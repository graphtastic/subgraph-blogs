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
    expect(res.body.data.blogs[0]).toHaveProperty('labels');
    expect(res.body.data.blogs[0]).toHaveProperty('author');
  });

  it('returns all authors', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: '{ authors { id name age description blogs { id title } } }'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.authors.length).toBeGreaterThan(0);
    expect(res.body.data.authors[0]).toHaveProperty('id');
    expect(res.body.data.authors[0]).toHaveProperty('name');
    expect(res.body.data.authors[0]).toHaveProperty('blogs');
  });

  it('returns a single blog by id', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: 'query($id: ID!) { blog(id: $id) { id title labels author { id name } } }',
        variables: { id: "1" }
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.blog).toBeTruthy();
    expect(res.body.data.blog.id).toBe("1");
    expect(res.body.data.blog.author).toBeTruthy();
  });

  it('returns null for a missing blog', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: 'query($id: ID!) { blog(id: $id) { id title } }',
        variables: { id: "999" }
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.blog).toBeNull();
  });

  it('returns a single author by id', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: 'query($id: ID!) { author(id: $id) { id name age description blogs { id title } } }',
        variables: { id: "101" }
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.author).toBeTruthy();
    expect(res.body.data.author.id).toBe("101");
    expect(res.body.data.author.blogs.length).toBeGreaterThan(0);
  });

  it('returns null for a missing author', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: 'query($id: ID!) { author(id: $id) { id name } }',
        variables: { id: "999" }
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.author).toBeNull();
  });

  it('returns correct nested blogs for an author', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: 'query($id: ID!) { author(id: $id) { id blogs { id title } } }',
        variables: { id: "101" }
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.author.blogs.length).toBeGreaterThan(0);
    expect(res.body.data.author.blogs[0]).toHaveProperty('id');
    expect(res.body.data.author.blogs[0]).toHaveProperty('title');
  });

  it('returns correct author for a blog', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: 'query($id: ID!) { blog(id: $id) { id author { id name } } }',
        variables: { id: "4" }
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.blog.author).toBeTruthy();
    expect(res.body.data.blog.author.name).toBe("Grace Hopper");
  });

  it('returns error for missing required id variable', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: 'query($id: ID!) { blog(id: $id) { id title } }'
        // no variables
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeTruthy();
  });

  it('returns error for invalid query', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: 'query { notAField }'
      });
    expect(res.statusCode).toBe(200); // GraphQL spec: always 200 unless transport error
    expect(res.body.errors).toBeTruthy();
    expect(res.body.errors[0].message).toMatch(/Cannot query field/);
  });
});
