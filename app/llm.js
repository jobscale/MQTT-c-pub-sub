import { logger } from '@jobscale/logger';
import { servers } from './server.js';

const server = servers['dark-gemma-it'];

export class LLM {
  async llmFetch(payload) {
    const res = await fetch(server.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  fetch(content) {
    const start = Date.now();
    return this.llmFetch({
      model: server.model,
      messages: [{ role: 'user', content }],
      temperature: 0.4,
      max_tokens: 1024,
    })
    .then(res => {
      const { content: message } = res.choices[0].message;
      return {
        message,
        model: server.model,
        benchmark: `${(Date.now() - start) / 1000}s`,
      };
    })
    .catch(e => {
      logger.error(e);
      return {};
    });
  }
}

export const llm = new LLM();

export default {
  LLM,
  llm,
};
