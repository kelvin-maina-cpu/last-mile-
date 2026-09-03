const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      const error = new Error('MONGODB_URI environment variable is required');
      logger.error({ err: error }, 'MongoDB connection configuration is missing');
      throw error;
    }

    const conn = await mongoose.connect(uri);
    logger.info({ host: conn.connection.host }, 'MongoDB connected');
    return conn;
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    throw error;
  }
};

module.exports = connectDB;
