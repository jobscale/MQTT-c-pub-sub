const http = require('http');
const mqtt = require('mqtt');
const { logger } = require('@jobscale/logger');
const { app, upgradeHandler, errorHandler } = require('./app');

const PORT = process.env.PORT || 3000;

const mqttSubscribe = () => {
  const topicSubscribe = '#';
  const client = mqtt.connect('mqtt://127.0.0.1:1883');
  client.on('connect', () => {
    logger.info('Connected to MQTT broker');
    client.subscribe(topicSubscribe, e => {
      if (e) {
        logger.error('Subscription failed:', e);
        return;
      }
      const response = {
        message: `Subscribed to topic '${topicSubscribe}'`,
        time: new Date().toISOString(),
        userId: 'Broker Server',
        name: 'Broker Server',
      };
      client.publish('broadcast', JSON.stringify(response));
    });
  });
  client.on('message', (topic, message) => {
    const payload = message.toString();
    logger.info({ payload, topic });
  });
  client.on('error', e => {
    logger.error('MQTT client error:', e);
  });
};

const main = async () => {
  mqttSubscribe();
  const server = http.createServer(app);
  server.on('upgrade', upgradeHandler);
  server.on('error', errorHandler);
  const options = {
    host: '0.0.0.0',
    port: PORT,
  };
  server.listen(options, () => {
    logger.info(JSON.stringify({
      Server: 'Started',
      'Listen on': `http://127.0.0.1:${options.port}`,
    }, null, 2));
  });
  return app;
};

module.exports = {
  server: main(),
};
