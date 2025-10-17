import { createRequest, createResponse } from './node-mocks-http.js';

export async function invoke(app, options = {}) {
  const { method = 'GET', url = '/', body, headers = {}, query = {} } = options;

  const req = createRequest({
    method,
    url,
    headers,
    body,
    query,
    app
  });

  const res = createResponse({ app });

  req.res = res;
  res.req = req;

  await new Promise((resolve, reject) => {
    const onFinish = () => resolve();
    const onError = (err) => reject(err);

    res.once('finish', onFinish);
    res.once('close', onFinish);
    res.once('error', onError);

    try {
      app.handle(req, res, (err) => {
        if (err) {
          onError(err);
          return;
        }
        if (!res.writableEnded && typeof res.end === 'function') {
          res.end();
        }
      });
    } catch (error) {
      onError(error);
    }
  });

  const buffer = typeof res._getBuffer === 'function' ? res._getBuffer() : null;
  const text = buffer ? buffer.toString('utf8') : res._getData?.() ?? '';

  let json;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }

  return {
    status: res.statusCode,
    text,
    json,
    headers: res._getHeaders ? res._getHeaders() : res.getHeaders?.() ?? {}
  };
}
