const logger = console;
const protocol = document.location.protocol === 'https:' ? 'wss' : 'ws';
const { hostname } = document.location;
const broker = `${protocol}://${/\.cdn\./.exec(hostname) ? 'mqtt.jsx.jp' : hostname}/mqtt`;
const client = mqtt.connect(broker);

Vue.createApp({
  data() {
    const qs = new URLSearchParams(document.location.search);
    const clientId = decodeURI(qs.get('r') || this.random());
    return {
      clientId,
      chats: [],
      input: '',
      count: 0,
      message: 'Now Loading ...',
    };
  },

  created() {
    this.subscribe();
  },

  mounted() {
    this.showScreen('', 1500);
  },

  methods: {
    subscribe() {
      const topicSubscribe = `chat/${this.clientId}/#`;
      client.subscribe(topicSubscribe);
      client.on('message', (topic, message) => {
        const payload = message.toString();
        logger.info({ payload, topic });
        this.chats.push({
          ...JSON.parse(payload),
          topic,
        });
        this.scroll();
      });
    },

    publish(payload) {
      const topic = `chat/${this.clientId}/speak`;
      client.publish(topic, JSON.stringify({
        ...payload,
        time: new Date().toISOString(),
        id: ++this.count,
      }));
    },

    scroll() {
      const { timeline } = this.$refs;
      setTimeout(() => timeline.scroll({
        top: timeline.scrollHeight,
        left: 0,
        behavior: 'smooth',
      }), 100);
    },

    onSubmit() {
      this.publish({
        message: this.input,
      });
      this.input = '';
    },

    onCopyLink() {
      const { origin } = document.location;
      const url = `${origin}?r=${encodeURIComponent(this.clientId)}`;
      window.navigator.clipboard.writeText(url)
      .then(() => {
        this.showScreen('Link URL Copied.', 1500);
      })
      .catch(e => {
        this.showScreen(e.message, 1500);
      });
    },

    showScreen(message, delay) {
      if (message) this.message = message;
      const { style } = this.$refs['full-screen'];
      style.display = '';
      if (delay) setTimeout(() => { style.display = 'none'; }, 1500);
    },

    random() {
      return 'xxxxxxx-a-xxx-y-xxxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; // eslint-disable-line no-bitwise
        const v = c === 'x' ? r : ((r & 0x3) | 0x8); // eslint-disable-line no-bitwise
        return v.toString(16);
      });
    },
  },
}).mount('#app');
