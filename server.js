const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ApolloServer, ApolloServerPluginLandingPageGraphQLPlayground  } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const knex = require('knex');


const app = express();
const httpServer = http.createServer(app);

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

const db = knex({
    client: 'mysql2',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'crud'
    }
});



// const typeDefs = `#graphql schema
// type Query {
//     hello: String
// }`;

// const resolvers = {
//     Query: {
//         hello: () => "Hello Suraj"
//     }
// };


const typeDefs = `#graphql
type Student {
    id: Int
    firstname: String
    lastname: String
    age: Int
    dob: String
    department: String
}

type Query {
    students: [Student]
    student(id: Int!): Student
}
type Mutation {
    createStudent(firstname: String!, lastname: String!, age: Int!, dob: String!, department: String!): Student
    updateStudent(id: Int!, firstname: String, lastname: String, age: Int, dob: String, department: String): Student
    deleteStudent(id: Int!): Student
}
`;

const resolvers = {
    Query: {
        students: async () => {
            return await db('student').select('*');
        },
        student: async (_, { id }) => {
            return await db('student').where({ id }).first();
        }
    },
    Mutation: {
        createStudent: async (_, { firstname, lastname, age, dob, department }) => {
            const [id] = await db('student').insert({
                firstname,
                lastname,
                age,
                dob,
                department
            }).returning('id');
            return await db('student').where({ id }).first();
        },
        updateStudent: async (_, { id, firstname, lastname, age, dob, department }) => {
            await db('student').where({ id }).update({
                firstname,
                lastname,
                age,
                dob,
                department
            });
            return await db('student').where({ id }).first();
        },
        deleteStudent: async (_, { id }) => {
            const student = await db('student').where({ id }).first();
            await db('student').where({ id }).del();
            return student;
        }
    }
};



const server = new ApolloServer({
    typeDefs,
    resolvers,
});

// Start the Apollo Server
server.start().then(() => {
    app.use(
        '/graphql',
        cors(),
        express.json(),
        expressMiddleware(server)
    );

    const port = 8080;
    httpServer.listen(port, () => {
        console.log(`Server running on http://localhost:${port}/graphql`);
    });
}).catch(err => {
    console.error('Error starting the server:', err);
});



