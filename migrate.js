const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateData() {
  const sourceUri = process.env.MONGODB_URI;
  const targetUri = process.env.DEV_MONGODB_URI;
  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    await sourceClient.connect();
    await targetClient.connect();
    console.log('Connected to MongoDB');

    const sourceDb = sourceClient.db();
    const targetDb = targetClient.db();

    // Migrate books
    const books = await sourceDb.collection('books').find({}).toArray();
    console.log(`Found ${books.length} documents in test.books`);

    if (books.length > 0) {
      const booksResult = await targetDb.collection('books').insertMany(books);
      console.log(`${booksResult.insertedCount} documents inserted into book-rating.books`);
    }

    // Migrate users
    const users = await sourceDb.collection('users').find({}).toArray();
    console.log(`Found ${users.length} documents in test.users`);

    if (users.length > 0) {
      const usersResult = await targetDb.collection('users').insertMany(users);
      console.log(`${usersResult.insertedCount} documents inserted into book-rating.users`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

migrateData();