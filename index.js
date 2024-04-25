const express = require('express');
const mongoose = require('mongoose');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const Children = require('./models/childrenModel');
const Collection = require('./models/collectionModel');
const Playlist = require('./models/playlistModel');
const Sub = require('./models/subsModel');

const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());
// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/proyecto', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err.message);
});

// Definir el esquema GraphQL
const schema = buildSchema(`
  type Children {
    _id: ID!
    name: String!
    pin: String!
    avatar: String!
    age: Int!
    collections: [Collection!]!
  }

  type Collection {
    _id: ID!
    name: String!
    videos: Int!
  }

  type Query {
    getChildCollections(childrenId: ID!): [Collection!]!
  }
`);

// Ajusta tu esquema GraphQL
const searchS = buildSchema(`
  type Playlist {
    _id: ID!
    name: String!
    url: String!
  }

  type Query {
    searchVideos(childrenId: ID!, searchText: String!): [Playlist!]!
  }
`);

// Definir los resolutores
const root = {
  getChildCollections: async ({ childrenId }) => {
    try {
      const subs = await Sub.find({ children: childrenId });
      const collectionIds = subs.map(sub => sub.collection);
      const collections = await Collection.find({ _id: { $in: collectionIds } });
      return collections;
    } catch (error) {
      throw new Error('Error fetching collections:', error);
    }
  }
};

const searchR = {
  searchVideos: async ({ childrenId, searchText }) => {
    try {
      const subs = await Sub.find({ children: childrenId });
      const collectionIds = subs.map(sub => sub.collection);
      const collections = await Collection.find({ _id: { $in: collectionIds } });

      // Filtrar los videos que coincidan con el searchText
      const matchedVideos = collections.flatMap(collection =>
        collection.videos.filter(video => video.name.includes(searchText))
      );

      return matchedVideos;
    } catch (error) {
      throw new Error('Error searching videos:', error);
    }
  }
};


// Endpoint GraphQL para consultas normales
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}));

// Endpoint GraphQL para búsqueda de videos
app.use('/graphql/search', graphqlHTTP({
  schema: searchS,
  rootValue: searchR,
  graphiql: true
}));


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
