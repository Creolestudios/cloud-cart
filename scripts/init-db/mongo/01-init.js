// ============================================================
// MongoDB Init Script
// Creates collections, indexes, and seed data
// ============================================================

db = db.getSiblingDB('cloudcart');

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'Email address - required',
        },
        password: {
          bsonType: 'string',
          description: 'Hashed password - required',
        },
        firstName: {
          bsonType: 'string',
          maxLength: 50,
        },
        lastName: {
          bsonType: 'string',
          maxLength: 50,
        },
        role: {
          enum: ['user', 'admin', 'moderator'],
          description: 'User role',
        },
      },
    },
  },
});

db.createCollection('orders');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1, createdAt: -1 });

print('CloudCart MongoDB initialized successfully');
