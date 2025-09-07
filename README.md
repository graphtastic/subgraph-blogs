# subgraph-blogs

## Project Overview
This project is a minimal, educational Apollo Federation subgraph for blogs and authors, built with GraphQL Yoga and Node.js. It includes a static schema, sample data, and API tests.

## Features
- **GraphQL Subgraph**: Apollo Federation-ready schema for blogs and authors
- **GraphQL Yoga**: Simple, modern GraphQL server
- **Static Schema**: Schema defined in `schema.graphql`
- **Sample Data**: Authors and blogs in `data.json`
- **API Tests**: Jest + Supertest for endpoint validation
- **Nodemon**: For development auto-reload

## Project Structure
```
subgraph-blogs/
├── compose.yaml           # (optional) Docker Compose config
├── data.json              # Sample authors and blogs data
├── index.js               # Main server entrypoint
├── package.json           # Project metadata and scripts
├── README.md              # This file
├── schema.graphql         # GraphQL schema (federated)
├── test/
│   └── api.test.js        # API tests (Jest + Supertest)
```

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm (comes with Node.js)

### Install dependencies
```sh
npm install
```

### Run the server
```sh
npm start
```
Server will be available at [http://localhost:4001/graphql](http://localhost:4001/graphql)

### Development mode (auto-reload)
```sh
npm run dev
```

### Run API tests
```sh
npm test
```

## GraphQL Schema
See [`schema.graphql`](./schema.graphql) for the full schema, including federation directives.

## Example Queries

**Get all blogs:**
```graphql
query {
	blogs {
		id
		title
		labels
		author {
			id
			name
		}
	}
}
```

**Get all authors:**
```graphql
query {
	authors {
		id
		name
		age
		description
		blogs {
			id
			title
		}
	}
}
```

## Scripts
- `npm start` — Start the server
- `npm run dev` — Start with auto-reload (nodemon)
- `npm test` — Run API tests
- `npm run test:watch` — Run tests in watch mode

## Customization
- Edit `data.json` to add or modify authors and blogs
- Edit `schema.graphql` to change the schema
- Add more tests in `test/`

## License
Apache 2.0

