import http from 'http';
import mqtt from 'mqtt';
import { logger } from '@jobscale/logger';
import { app, upgradeHandler, errorHandler } from './app/index.js';
import { llm } from './app/llm.js';

const PORT = Number.parseInt(process.env.PORT || 3000, 10);
const ENV = process.env.ENV || 'k8s';
const broker = {
  k8s: 'mqtt://n100.jsx.jp:1883',
  local: 'mqtt://a.jsx.jp:1883',
}[ENV];

const mqttSubscribe = () => {
  const topicSubscribe = '#';
  const client = mqtt.connect(broker);
  client.on('connect', () => {
    logger.info('Connected to MQTT broker');
    client.subscribe(topicSubscribe, e => {
      if (e) {
        logger.error('Subscription failed:', e);
        return;
      }
      client.publish('broadcast', JSON.stringify({
        message: `Subscribed to topic '${topicSubscribe}'`,
        time: new Date().toISOString(),
        userId: 'Broker Server',
        name: 'Broker Server',
      }));
    });
  });
  client.on('message', async (topic, message) => {
    const payload = message.toString();
    logger.info({ payload, topic });
    const item = JSON.parse(payload);
    const [prefix] = topic.split('-');
    if (prefix !== 'chat/ai') return;
    if (item.userId === 'Broker Server') return;
    if (item.userId === 'AI') return;
    if (item.message.includes('joined')) return;
    const res = await llm.fetch(item.message);
    client.publish(topic, JSON.stringify({
      message: `${res.message || 'no good'}\ntime ${res.benchmark}`,
      time: new Date().toISOString(),
      userId: 'AI',
      name: 'AI',
    }));
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

export default {
  server: main(),
};
