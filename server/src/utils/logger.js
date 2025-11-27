import pino from 'pino';
import { randomUUID } from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

// Configure Pino logger with structured JSON logging for CloudWatch
const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
        service: 'mangu-server',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // In production, use JSON format for CloudWatch parsing
  // In development, use pretty printing for readability
  ...(!isProduction && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      query: req.query,
      ip: req.ip,
      correlationId: req.headers['x-correlation-id']
    }),
    res: (res) => ({
      statusCode: res.statusCode
    }),
    err: pino.stdSerializers.err
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'password',
      'token',
      'secret'
    ],
    censor: '[REDACTED]'
  }
});

// Middleware to add correlation ID to requests
export function correlationIdMiddleware(req, res, next) {
  req.id = req.headers['x-correlation-id'] || randomUUID();
  res.setHeader('X-Correlation-Id', req.id);
  
  // Create child logger with correlation ID
  req.log = logger.child({
    correlationId: req.id,
    requestId: req.id
  });
  
  next();
}

// Request logging middleware
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  req.log.info({
    msg: 'Incoming request',
    req
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      msg: 'Request completed',
      req,
      res,
      duration
    };

    if (res.statusCode >= 500) {
      req.log.error(logData);
    } else if (res.statusCode >= 400) {
      req.log.warn(logData);
    } else {
      req.log.info(logData);
    }
  });

  next();
}

// Context logger - create child logger with additional context
export function createContextLogger(context) {
  return logger.child(context);
}

export default logger;
