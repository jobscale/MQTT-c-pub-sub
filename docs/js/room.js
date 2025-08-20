import { createApp } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.min.js';
import { createLogger } from 'https://esm.sh/@jobscale/logger@0.8.4';

const logger = createLogger('debug', { timestamp: true });

createApp({
  data() {
    return {
      clientId: '(Now Loading ...)',
      message: 'Now Loading ...',
    };
  },

  mounted() {
    logger.debug('mounted');
    this.showScreen('', 1500);
    this.onNewRoom();
    this.$refs.input.focus();
  },

  methods: {
    onSubmit() {
      document.location.href = `/?r=${encodeURIComponent(this.clientId)}`;
    },

    onNewRoom() {
      this.$refs.input.focus();
      this.clientId = '(Now Loading ...)';
      setTimeout(() => { this.clientId = this.random(); }, 1000);
    },

    showScreen(message, delay) {
      if (message) this.message = message;
      const { style } = this.$refs['full-screen'];
      style.display = '';
      if (delay) setTimeout(() => { style.display = 'none'; }, 1500);
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
