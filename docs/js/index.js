const logger = console;
const broker = 'wss://mqtt.jsx.jp/mqtt';
const client = mqtt.connect(broker);

Vue.createApp({
  data() {
    const qs = new URLSearchParams(document.location.search);
    const room = qs.get('r');
    const clientId = room && decodeURI(room);
    if (!clientId) {
      document.location.href = `${document.location.origin}?r=${this.random()}`;
    }
    const userId = this.random();
    return {
      ts: dayjs().format('YYYY-MM-DD hh:mm:ss'),
      clientId,
      userId,
      chats: [],
      input: '',
      count: 0,
      message: '',
    };
  },

  created() {
    this.subscribe();
    const format = 'YYYY-MM-DD hh:mm:ss';
    setInterval(() => { this.ts = dayjs().format(format); }, 1000);
  },

  mounted() {
    this.showScreen('Now Loading ...', 1500);
    this.publish({
      message: `[${this.userId}] joined.`,
    });
  },

  methods: {
    subscribe() {
      const topicSubscribe = `chat/${this.clientId}/#`;
      client.subscribe(topicSubscribe);
      client.on('message', (...argv) => this.onMessage(...argv));
    },

    onMessage(topic, message) {
      const payload = message.toString();
      logger.info({ payload, topic });
      this.chats.push({
        ...JSON.parse(payload),
        topic,
      });
      this.scroll();
    },

    publish(payload) {
      const topic = `chat/${this.clientId}/speak`;
      client.publish(topic, JSON.stringify({
        ...payload,
        time: new Date().toISOString(),
        userId: this.userId,
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

    timestamp(time) {
      return dayjs(time).format('hh:mm:ss');
    },

    random() {
      return 'yxx-yxx-yxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; // eslint-disable-line no-bitwise
        const v = c === 'x' ? r : ((r & 0x3) | 0x8); // eslint-disable-line no-bitwise
        return v.toString(16);
      });
    },
  },
}).mount('#app');
