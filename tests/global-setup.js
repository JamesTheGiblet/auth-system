const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  global.__MONGO_INSTANCE__ = mongoServer;
  process.env.MONGODB_URI = mongoUri;
};