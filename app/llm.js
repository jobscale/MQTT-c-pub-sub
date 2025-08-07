const { servers } = require('./server');

const server = servers['local-gemma-3'];

class LLM {
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
      max_tokens: 64,
    })
    .then(res => {
      const { content: message } = res.choices[0].message;
      return {
        message,
        model: server.model,
        benchmark: `${(Date.now() - start) / 1000}s`,
      };
    });
  }
}

module.exports = {
  LLM,
  llm: new LLM(),
};
