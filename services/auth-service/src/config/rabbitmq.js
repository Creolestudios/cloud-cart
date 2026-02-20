// ============================================================
// Auth Service — RabbitMQ Configuration
// ============================================================

const amqplib = require('amqplib');
const logger = require('../utils/logger');

let channel = null;
let connection = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

const EXCHANGES = {
  USER_EVENTS: 'user.events',
};

const QUEUES = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
};

const connectRabbitMQ = async () => {
  try {
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare exchange
    await channel.assertExchange(EXCHANGES.USER_EVENTS, 'topic', {
      durable: true,
    });

    // Declare queues
    for (const queue of Object.values(QUEUES)) {
      await channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-dead-letter-exchange': 'dlx.user.events',
        },
      });
    }

    // Bind queues to exchange
    await channel.bindQueue(QUEUES.USER_CREATED, EXCHANGES.USER_EVENTS, 'user.created');
    await channel.bindQueue(QUEUES.USER_UPDATED, EXCHANGES.USER_EVENTS, 'user.updated');
    await channel.bindQueue(QUEUES.USER_DELETED, EXCHANGES.USER_EVENTS, 'user.deleted');

    logger.info('RabbitMQ channel established');

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });

    return channel;
  } catch (err) {
    logger.error('RabbitMQ connection failed:', err);
    throw err;
  }
};

const publishEvent = async (routingKey, data) => {
  try {
    if (!channel) {
      logger.warn('RabbitMQ channel not available, skipping event publish');
      return;
    }

    const message = Buffer.from(JSON.stringify({
      event: routingKey,
      data,
      timestamp: new Date().toISOString(),
      service: 'auth-service',
    }));

    channel.publish(EXCHANGES.USER_EVENTS, routingKey, message, {
      persistent: true,
      contentType: 'application/json',
    });

    logger.debug(`Published event: ${routingKey}`);
  } catch (err) {
    logger.error(`Failed to publish event ${routingKey}:`, err);
  }
};

const getChannel = () => channel;

module.exports = { connectRabbitMQ, publishEvent, getChannel, EXCHANGES, QUEUES };
