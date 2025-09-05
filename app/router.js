export class Router {
  constructor() {
    this.routes = [];
  }

  // ルート登録
  add(method, path, handler) {
    this.routes.push({ method: method.toUpperCase(), path, handler });
  }

  // サブルーターを前方一致でマージ
  use(prefix, subRouter) {
    subRouter.routes.forEach(route => {
      this.routes.push({
        method: route.method,
        path: prefix + route.path,
        handler: route.handler,
      });
    });
  }

  // リクエスト処理
  handle(req, res) {
    const headers = new Headers(req.headers);
    const method = req.method.toUpperCase();
    const protocol = req.socket.encrypted ? 'https' : 'http';
    const host = headers.get('host');
    const { pathname } = new URL(`${protocol}://${host}${req.url}`);
    const route = this.routes.find(r => method === r.method && pathname === r.path);
    if (route) route.handler(req, res);
  }
}

export const router = new Router();
export default {
  Router,
  router,
};
