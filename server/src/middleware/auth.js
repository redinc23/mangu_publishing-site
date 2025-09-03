import { verifyToken } from '../config/cognito.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const verification = await verifyToken(token);
  
  if (!verification.success) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = verification.user;
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user?.groups?.includes('admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const rateLimitMap = new Map();

export const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, startTime: now });
      return next();
    }
    
    const record = rateLimitMap.get(ip);
    
    if (now - record.startTime > windowMs) {
      record.count = 1;
      record.startTime = now;
    } else {
      record.count++;
    }
    
    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    next();
  };
};
