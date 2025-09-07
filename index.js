import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga'

const typeDefs = /* GraphQL */ `
  type Query {
    blogs: [Blog!]
    blog(id: ID!): Blog
  }

  type Blog @key(fields: "id") {
    id: ID!
    title: String!
    author: Author
  }

  # We are extending the Author type, which is owned by the authors subgraph.
  # The @key directive tells the gateway how to fetch an Author.
  # The @extends directive tells the gateway this type is defined elsewhere.
  type Author @key(fields: "id") @extends {
    id: ID! @external
  }
`;

const blogsData = [
  { id: '1', title: 'Introduction to GraphQL', authorId: '101' },
  { id: '2', title: 'Federation Deep Dive', authorId: '102' },
];

const resolvers = {
  Query: {
    blogs: () => blogsData,
    blog: (_, { id }) => blogsData.find(b => b.id === id),
  },
  Blog: {
    // This resolver provides the "link" to the Author type.
    // It returns a representation containing the key field ('id').
    // The gateway will use this to fetch the full Author from the other subgraph.
    author: (blog) => {
      return { __typename: "Author", id: blog.authorId };
    }
  }
};

const yoga = createYoga({ schema: createSchema({ typeDefs, resolvers }) });
const server = createServer(yoga);
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => { console.info(`Blogs subgraph running at http://localhost:${PORT}/graphql`) });
