const { logger } = require('@jobscale/logger');
const http = require('http');
const httpProxy = require('http-proxy');
const mqtt = require('mqtt');
const { App } = require('./app');

const mqttDescribe = () => {
  const topicSubscribe = '#';
  const client = mqtt.connect('mqtt://127.0.0.1:1883');
  client.on('connect', () => {
    logger.info('Connected to MQTT broker');
    client.subscribe(topicSubscribe, e => {
      if (e) {
        logger.error('Subscription failed:', e);
        return;
      }
      logger.info('Subscribed to topic:', topicSubscribe);
      const response = {
        message: 'hello connected',
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
  mqttDescribe();
  const prom = {};
  prom.pending = new Promise(resolve => { prom.resolve = resolve; });
  const app = new App().start();
  const server = http.createServer(app);
  const proxy = httpProxy.createProxyServer();
  server.on('upgrade', (req, socket, head) => {
    const headers = new Headers(req.headers);
    if (req.url.startsWith('/mqtt')) {
      const upgrade = headers.get('upgrade');
      logger.info({ url: req.url, upgrade });
      proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:12470' });
    } else {
      socket.destroy();
    }
  });
  const options = {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
  };
  server.listen(options, () => {
    logger.info(JSON.stringify({
      Server: 'Started',
      'Listen on': `http://127.0.0.1:${options.port}`,
    }, null, 2));
    prom.resolve(app);
  });
  return Promise.all([prom.pending]);
};

module.exports = {
  server: main(),
};
