import os from 'os';
import path from 'path';
import fs from 'fs';
import mime from 'mime';
import createHttpError from 'http-errors';
import httpProxy from 'http-proxy';
import { logger } from '@jobscale/logger';
import { router, Router } from './router.js';

const proxy = httpProxy.createProxyServer({ xfwd: true });
const target = 'ws://a.jsx.jp:12470';

class Ingress {
  useHeader(req, res) {
    const headers = new Headers(req.headers);
    const protocol = req.socket.encrypted ? 'https' : 'http';
    const host = headers.get('host');
    const origin = headers.get('origin') || `${protocol}://${host}`;
    res.setHeader('ETag', 'false');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Server', 'acl-ingress-k8s');
    res.setHeader('X-Backend-Host', os.hostname());
  }

  usePublic(req, res) {
    if (!['GET', 'HEAD'].includes(req.method)) return false;
    const headers = new Headers(req.headers);
    const { url } = req;
    const protocol = req.socket.encrypted ? 'https' : 'http';
    const host = headers.get('host');
    const { pathname } = new URL(`${protocol}://${host}${url}`);
    const baseDir = path.join(process.cwd(), 'docs');
    const file = {
      path: path.join(baseDir, pathname),
    };
    if (!file.path.startsWith(baseDir)) return false;
    file.stat = fs.existsSync(file.path) && fs.statSync(file.path);
    if (!file.stat) return false;
    if (file.stat.isDirectory()) {
      if (!file.path.endsWith('/')) {
        res.writeHead(307, { Location: `${url}/` });
        res.end();
        return true;
      }
      file.path += 'index.html';
      file.stat = fs.existsSync(file.path) && fs.statSync(file.path);
      if (!file.stat) return false;
    }
    const contentType = mime.getType(file.path) || 'application/octet-stream';
    const contentLength = file.stat.size;
    const stream = fs.createReadStream(file.path);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': contentLength,
    });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    stream.pipe(res);
    return true;
  }

  useLogging(req, res) {
    const ts = new Date().toISOString();
    const progress = () => {
      const headers = new Headers(req.headers);
      const ip = req.socket.remoteAddress || req.ip;
      const remoteIp = headers.get('X-Real-Ip') || headers.get('X-Forwarded-For') || ip;
      const { method, url } = req;
      const protocol = req.socket.encrypted ? 'https' : 'http';
      const host = headers.get('host');
      logger.info({
        ts,
        req: JSON.stringify({
          remoteIp, protocol, host, method, url,
        }),
        headers: JSON.stringify(Object.fromEntries(headers.entries())),
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
  }

  useRoute(req, res) {
    const headers = new Headers(req.headers);
    const method = req.method.toUpperCase();
    const protocol = req.socket.encrypted ? 'https' : 'http';
    const host = headers.get('host');
    const { pathname, searchParams } = new URL(`${protocol}://${host}${req.url}`);
    const route = `${method} ${pathname}`;
    logger.debug({ route, searchParams });

    router.handle(req, res);
    if (res.writableEnded) return;

    this.notfoundHandler(req, res);
  }

  notfoundHandler(req, res) {
    if (req.method === 'GET') {
      const e = createHttpError(404);
      res.writeHead(e.status, { 'Content-Type': 'text/plain' });
      res.end(e.message);
      return;
    }
    const e = createHttpError(501);
    res.writeHead(e.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: e.message }));
  }

  upgradeHandler(req, socket, head) {
    const headers = new Headers(req.headers);
    const upgrade = headers.get('upgrade');
    logger.info({ url: req.url, upgrade });
    if (req.url.startsWith('/')) {
      proxy.ws(req, socket, head, { target });
      return;
    }
    socket.destroy();
  }

  errorHandler(e, req, res) {
    logger.error(e);
    if (!res) return;
    if (req.method === 'GET') {
      e = createHttpError(503);
      res.writeHead(e.status, { 'Content-Type': 'text/plain' });
      res.end(e.message);
      return;
    }
    if (!e.status) e = createHttpError(500);
    res.writeHead(e.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: e.message }));
  }

  start() {
    router.add('POST', '/black/pink', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ color: 'pink' }));
    });
    const sub = new Router();
    sub.add('POST', '/green', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ color: 'green' }));
    });
    router.use('/blue', sub);

    return (req, res) => {
      try {
        this.useHeader(req, res);
        if (this.usePublic(req, res)) return;
        this.useLogging(req, res);
        this.useRoute(req, res);
      } catch (e) {
        this.errorHandler(e, req, res);
      }
    };
  }
}

const ingress = new Ingress();
export const app = ingress.start();
const { upgradeHandler, errorHandler } = ingress;
export { upgradeHandler, errorHandler };
export default app;
