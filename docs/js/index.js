const [protocol] = window.location.origin.split(':');
const wss = { https: 'wss', http: 'ws' };
const without = window.location.host.match('.cdn.') || window.location.host.match('127.0.0.1');
const broker = without
  ? 'wss://mqtt.jsx.jp/mqtt'
  : `${wss[protocol]}://${window.location.host}/mqtt`;
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
    const name = sessionStorage.getItem('name') || 'anonymous';
    return {
      ts: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      clientId,
      userId,
      name,
      chats: [],
      input: '',
      count: 0,
      message: '',
    };
  },

  created() {
    this.subscribe();
    const format = 'YYYY-MM-DD HH:mm:ss';
    setInterval(() => { this.ts = dayjs().format(format); }, 1000);
  },

  mounted() {
    this.showScreen('Now Loading ...', 1500);
    this.publish({
      message: `${this.name} joined in room.`,
    });
    this.$refs.input.focus();
  },

  methods: {
    subscribe() {
      const topicSubscribe = `chat/${this.clientId}/#`;
      client.subscribe(topicSubscribe);
      client.on('message', (...argv) => this.onMessage(...argv));
    },

    onMessage(topic, data) {
      const payload = JSON.parse(data.toString());
      const httpRegexG = /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*))/g;
      const plaintext = payload.message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const htmlText = plaintext.replace(httpRegexG, '<a target="_blank" href="$1">$1</a>');
      const message = htmlText.replace(/\\n/g, '<br>');
      this.chats.push({
        ...payload,
        message,
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
        name: this.name,
        id: ++this.count,
      }));
      sessionStorage.setItem('name', this.name);
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
      this.$refs.input.focus();
      if (!this.input) return;
      this.publish({
        message: this.input,
      });
      this.input = '';
    },

    onCreateRoom() {
      document.location.href = '/room';
    },

    onCopyLink() {
      this.$refs.input.focus();
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

    date(time) {
      return dayjs(time).format('YYYY-MM-DD');
    },

    timestamp(time) {
      return dayjs(time).format('HH:mm:ss');
    },

    username(chat) {
      if (chat.userId === this.userId) return 'You';
      return chat.name;
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
