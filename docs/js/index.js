import MarkdownIt from 'https://esm.sh/markdown-it@14';
import DOMPurify from 'https://esm.sh/dompurify@3';
import dayjs from 'https://esm.sh/dayjs@1.11.10';
import { createApp } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
// import { createLogger } from 'https://esm.sh/@jobscale/logger'; // ロガーライブラリのインポートは一時的に削除

const logger = (std => {
  const instant = {
    debug: std.log,
    info: std.log,
    error: std.error,
    warn: std.warn,
  };
  return instant;
})(console);

const [protocol] = window.location.origin.split(':');
const wss = { https: 'wss', http: 'ws' };
const without = window.location.host.match('.cdn.') || window.location.host.match('127.0.0.1');
const broker = without
  ? 'wss://mqtt.jsx.jp/mqtt'
  : `${wss[protocol]}://${window.location.host}/mqtt`;

const client = mqtt.connect(broker);

client.on('connect', () => {
  logger.debug('MQTT Connected!');
});
client.on('error', (err) => {
  logger.error('MQTT Connection Error:', err);
});
client.on('offline', () => {
  logger.warn('MQTT Client went offline (reconnecting automatically).');
});
client.on('reconnect', () => {
  logger.info('MQTT Client reconnecting...');
});

createApp({
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
      // Initialize markdown-it with auto-linking and breaks enabled
      const md = new MarkdownIt({
        linkify: true, breaks: true,
      });
      // Keep a reference to the default link renderer
      const defaultRender = md.renderer.rules.link_open
      || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

      // Override the link_open rule to add target="_blank" and rel="noopener noreferrer"
      md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        // Add target="_blank"
        tokens[idx].attrPush(['target', '_blank']);
        // Add rel="noopener noreferrer" for security when using target="_blank"
        tokens[idx].attrPush(['rel', 'noopener noreferrer']);
        // Call the original renderer to complete the HTML tag generation
        return defaultRender(tokens, idx, options, env, self);
      };

      // Render the Markdown message to raw HTML
      const rawHtml = md.render(payload.message);

      // Sanitize the HTML using DOMPurify
      // Ensure 'a' tag and 'href', 'target', 'rel' attributes are explicitly allowed
      const message = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'hr'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      });

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
