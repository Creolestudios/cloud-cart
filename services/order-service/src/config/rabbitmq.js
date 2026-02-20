// ============================================================
// Order Service — RabbitMQ Configuration
// ============================================================

const amqplib = require('amqplib');
const logger = require('../utils/logger');

let channel = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

const connectRabbitMQ = async () => {
  const connection = await amqplib.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  // Declare order exchange
  await channel.assertExchange('order.events', 'topic', { durable: true });

  // Declare queues
  await channel.assertQueue('order.created', { durable: true });
  await channel.assertQueue('order.updated', { durable: true });
  await channel.assertQueue('order.stock.update', { durable: true });

  // Bind queues
  await channel.bindQueue('order.created', 'order.events', 'order.created');
  await channel.bindQueue('order.updated', 'order.events', 'order.updated');

  logger.info('RabbitMQ connected');
  return channel;
};

const publishEvent = async (routingKey, data) => {
  if (!channel) return;
  
  const message = Buffer.from(JSON.stringify({
    event: routingKey,
    data,
    timestamp: new Date().toISOString(),
    service: 'order-service',
  }));

  channel.publish('order.events', routingKey, message, {
    persistent: true,
    contentType: 'application/json',
  });

  logger.debug(`Published event: ${routingKey}`);
};

const consumeEvents = async () => {
  if (!channel) return;

  // Listen for user events from auth service
  await channel.assertQueue('order.user.events', { durable: true });
  
  channel.consume('order.user.events', (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      logger.info(`Received event: ${event.event}`, event.data);
      channel.ack(msg);
    }
  });
};

module.exports = { connectRabbitMQ, publishEvent, consumeEvents };
