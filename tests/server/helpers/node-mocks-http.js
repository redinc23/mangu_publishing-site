import { Readable, Writable } from 'stream';
import { EventEmitter } from 'events';
import { Buffer } from 'buffer';
import { URLSearchParams } from 'url';

const DEFAULT_REMOTE_ADDRESS = '127.0.0.1';

class MockSocket extends EventEmitter {
  constructor() {
    super();
    this.readable = true;
    this.writable = true;
    this.remoteAddress = DEFAULT_REMOTE_ADDRESS;
    this.encrypted = false;
  }

  setTimeout() {}

  setNoDelay() {}

  setKeepAlive() {}

  address() {
    return { address: this.remoteAddress, family: 'IPv4', port: 0 };
  }

  write() {
    return true;
  }

  end() {
    this.emit('finish');
  }

  destroy() {
    this.emit('close');
  }
}

function normalizeHeaders(headers = {}) {
  const normalized = {};
  const raw = [];

  Object.entries(headers).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    const headerName = key.toLowerCase();
    normalized[headerName] = Array.isArray(value) ? value.map(String) : String(value);
    raw.push(key, normalized[headerName]);
  });

  return { normalized, raw };
}

function buildUrl(url = '/', query = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  if (!queryString) {
    return url;
  }

  return url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
}

class MockRequest extends Readable {
  constructor(options) {
    super();
    const {
      method,
      url,
      headers,
      rawHeaders,
      query,
      bodyBuffer,
      app
    } = options;

    this.method = method;
    this.url = url;
    this.originalUrl = url;
    this.path = url.split('?')[0];
    this.headers = headers;
    this.rawHeaders = rawHeaders;
    this.query = query;
    this.app = app;
    this.socket = this.connection = new MockSocket();
    this.body = undefined;
    this._bodyBuffer = bodyBuffer;
    this._bodyConsumed = false;
    this.httpVersion = '1.1';
    this.httpVersionMajor = 1;
    this.httpVersionMinor = 1;
    this.ip = DEFAULT_REMOTE_ADDRESS;

    this._read = this._read.bind(this);
    this.get = this.get.bind(this);
    this.header = this.header.bind(this);
  }

  get(field) {
    return this.headers[String(field).toLowerCase()];
  }

  header(field) {
    return this.get(field);
  }

  _read() {
    if (this._bodyConsumed) {
      this.push(null);
      return;
    }

    this._bodyConsumed = true;
    if (this._bodyBuffer) {
      this.push(this._bodyBuffer);
    }
    this.push(null);
  }
}

class MockResponse extends Writable {
  constructor(app) {
    super();
    this.app = app;
    this.statusCode = 200;
    this.headers = {};
    this.locals = {};
    this.finished = false;
    this._chunks = [];
    this._write = this._write.bind(this);
    this.end = this.end.bind(this);
    this.status = this.status.bind(this);
    this.set = this.set.bind(this);
    this.header = this.header.bind(this);
    this.type = this.type.bind(this);
    this.setHeader = this.setHeader.bind(this);
    this.getHeader = this.getHeader.bind(this);
    this.getHeaders = this.getHeaders.bind(this);
    this.removeHeader = this.removeHeader.bind(this);
    this.writeHead = this.writeHead.bind(this);
    this.json = this.json.bind(this);
    this.send = this.send.bind(this);
    this._getData = this._getData.bind(this);
    this._getBuffer = this._getBuffer.bind(this);
    this._getHeaders = this._getHeaders.bind(this);
  }

  setHeader(field, value) {
    this.headers[String(field).toLowerCase()] = value;
  }

  getHeader(field) {
    return this.headers[String(field).toLowerCase()];
  }

  getHeaders() {
    return { ...this.headers };
  }

  removeHeader(field) {
    delete this.headers[String(field).toLowerCase()];
  }

  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => this.setHeader(key, value));
    }
    return this;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  set(field, value) {
    if (typeof field === 'object') {
      Object.entries(field).forEach(([key, val]) => this.setHeader(key, val));
    } else {
      this.setHeader(field, value);
    }
    return this;
  }

  header(field, value) {
    return this.set(field, value);
  }

  type(value) {
    this.setHeader('Content-Type', value);
    return this;
  }

  _write(chunk, encoding, callback) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
    this._chunks.push(buffer);
    callback();
  }

  end(chunk, encoding, callback) {
    if (typeof chunk === 'function') {
      callback = chunk;
      chunk = undefined;
      encoding = undefined;
    }
    if (chunk !== undefined) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
      this._chunks.push(buffer);
    }
    this.bodyBuffer = Buffer.concat(this._chunks);
    this.finished = true;
    super.end(null, encoding, callback);
  }

  json(data) {
    if (!this.getHeader('content-type')) {
      this.setHeader('content-type', 'application/json; charset=utf-8');
    }
    const payload = Buffer.from(JSON.stringify(data));
    this._chunks = [payload];
    return this.end();
  }

  send(data) {
    if (data === undefined || data === null) {
      return this.end();
    }

    if (Buffer.isBuffer(data)) {
      if (!this.getHeader('content-type')) {
        this.setHeader('content-type', 'application/octet-stream');
      }
      this._chunks = [data];
      return this.end();
    }

    if (typeof data === 'object') {
      if (!this.getHeader('content-type')) {
        this.setHeader('content-type', 'application/json; charset=utf-8');
      }
      this._chunks = [Buffer.from(JSON.stringify(data))];
      return this.end();
    }

    if (!this.getHeader('content-type')) {
      this.setHeader('content-type', 'text/plain; charset=utf-8');
    }
    this._chunks = [Buffer.from(String(data))];
    return this.end();
  }

  _getData() {
    if (!this.bodyBuffer) {
      return '';
    }
    return this.bodyBuffer.toString('utf8');
  }

  _getBuffer() {
    return this.bodyBuffer || Buffer.alloc(0);
  }

  _getHeaders() {
    return this.getHeaders();
  }
}

export function createRequest(options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const query = options.query || {};
  const url = buildUrl(options.url || '/', query);
  const headerInput = options.headers || {};
  const { normalized: headers, raw: rawHeaders } = normalizeHeaders(headerInput);

  let bodyBuffer = null;
  if (options.body !== undefined) {
    if (Buffer.isBuffer(options.body)) {
      bodyBuffer = options.body;
    } else if (typeof options.body === 'string') {
      bodyBuffer = Buffer.from(options.body);
    } else {
      bodyBuffer = Buffer.from(JSON.stringify(options.body));
      if (!headers['content-type']) {
        headers['content-type'] = 'application/json';
      }
    }

    if (!headers['content-length']) {
      headers['content-length'] = String(Buffer.byteLength(bodyBuffer));
    }
  }

  const req = new MockRequest({
    method,
    url,
    headers,
    rawHeaders,
    query,
    bodyBuffer,
    app: options.app
  });

  if (options.ip) {
    req.ip = options.ip;
    req.socket.remoteAddress = options.ip;
  }

  req.app = options.app;

  return req;
}

export function createResponse(options = {}) {
  const res = new MockResponse(options.app);
  res.app = options.app;
  return res;
}
