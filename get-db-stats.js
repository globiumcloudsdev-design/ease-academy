const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable not set');
  process.exit(1);
}

async function getDBStats() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const stats = await db.stats();

    console.log('Database Statistics:');
    console.log(`Database Name: ${stats.db}`);
    console.log(`Total Size: ${stats.dataSize} bytes (${(stats.dataSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Storage Size: ${stats.storageSize} bytes (${(stats.storageSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Index Size: ${stats.indexSize} bytes (${(stats.indexSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Total Documents: ${stats.objects}`);
    console.log(`Collections: ${stats.collections}`);
    console.log(`Indexes: ${stats.indexes}`);

    // Get collection-specific stats
    const collections = await db.listCollections().toArray();
    console.log('\nCollection Details:');
    for (const coll of collections) {
      const collStats = await db.collection(coll.name).stats();
      console.log(`${coll.name}: ${collStats.count} documents, ${(collStats.size / 1024 / 1024).toFixed(2)} MB`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error getting database stats:', error);
  }
}

getDBStats();
