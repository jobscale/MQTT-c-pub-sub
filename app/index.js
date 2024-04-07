const os = require('os');
const path = require('path');
const http = require('http');
const createHttpError = require('http-errors');
const express = require('express');
const httpProxy = require('http-proxy');
const { logger } = require('@jobscale/logger');

const app = express();
const server = http.createServer(app);
const proxy = httpProxy.createProxyServer();

class App {
  useParser() {
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
  }

  useHeader() {
    app.set('etag', false);
    app.set('x-powered-by', false);
    app.use((req, res, next) => {
      const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
      res.header('Access-Control-Allow-Origin', `${origin}`);
      res.header('Access-Control-Allow-Methods', 'GET, POST, HEAD');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Server', 'acl-ingress-k8s');
      res.header('X-Backend-Host', os.hostname());
      next();
    });
  }

  usePublic() {
    const docs = path.resolve(process.cwd(), 'docs');
    app.use(express.static(docs));
  }

  useLogging() {
    app.use((req, res, next) => {
      const ts = new Date().toLocaleString();
      const progress = () => {
        const remoteIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const { protocol, method, url } = req;
        const headers = JSON.stringify(req.headers);
        logger.info({
          ts, remoteIp, protocol, method, url, headers,
        });
      };
      progress();
      res.on('finish', () => {
        const { statusCode, statusMessage } = res;
        const headers = JSON.stringify(res.getHeaders());
        logger.info({
          ts, statusCode, statusMessage, headers,
        });
      });
      next();
    });
  }

  notfoundHandler() {
    app.use((req, res) => {
      if (req.method === 'GET') {
        const e = createHttpError(404);
        res.locals.e = e;
        logger.info({ locals: JSON.stringify(res.locals) });
        res.status(e.status).send(e.message);
        return;
      }
      const e = createHttpError(501);
      res.status(e.status).json({ message: e.message });
    });
  }

  errorHandler() {
    app.use((e, req, res, done) => {
      (never => never)(done);
      if (!e.status) e.status = 503;
      if (req.method === 'GET') {
        res.locals.e = e;
        logger.info({ locals: JSON.stringify(res.locals) });
        res.status(e.status).send(e.message);
        return;
      }
      res.status(e.status).json({ message: e.message });
    });
  }

  start() {
    this.useParser();
    this.useHeader();
    this.usePublic();
    this.useLogging();
    app.use('/mqtt', (req, res) => {
      const headers = new Headers(req.headers);
      logger.info({ upgrade: headers.get('upgrade') });
      proxy.ws(req, res, { target: 'ws://127.0.0.1:12470' });
    });
    this.notfoundHandler();
    this.errorHandler();
    return app;
  }
}

module.exports = {
  App,
};
