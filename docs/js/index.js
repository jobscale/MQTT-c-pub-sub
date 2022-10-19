const logger = console;
const protocol = document.location.protocol === 'https:' ? 'wss' : 'ws';
const { hostname } = document.location;
const client = mqtt.connect(`${protocol}://${hostname}/mqtt`);
const state = {
  count: 0,
};

Vue.createApp({
  data() {
    return {
      chats: [],
      input: '',
    };
  },

  created() {
    this.subscribe();
  },

  methods: {
    subscribe() {
      const topicSubscribe = '#';
      client.subscribe(topicSubscribe);
      client.on('message', (topic, message) => {
        const payload = message.toString();
        logger.info({ payload, topic });
        this.chats.push({
          ...JSON.parse(payload),
          topic,
        });
      });
    },

    publish(payload) {
      const topic = 'hello/world';
      client.publish(topic, JSON.stringify({
        ...payload,
        time: new Date().toISOString(),
        id: ++state.count,
      }));
    },

    onSubmit() {
      this.publish({
        message: this.input,
      });
      this.input = '';
    },
  },
}).mount('#app');
