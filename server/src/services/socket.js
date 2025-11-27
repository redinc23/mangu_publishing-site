import { Server } from 'socket.io';
import logger, { createContextLogger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

const socketLogger = createContextLogger({ component: 'socket' });

let io = null;
const connectedUsers = new Map(); // userId -> Set of socketIds
const socketToUser = new Map(); // socketId -> userId
const userPresence = new Map(); // userId -> { status, lastSeen, metadata }

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 * @param {Object} options - Socket.IO configuration options
 */
export function initializeSocket(server, options = {}) {
  if (io) {
    socketLogger.warn('Socket.IO already initialized');
    return io;
  }

  const {
    cors = {
      origin: process.env.CLIENT_URL || 'http://localhost:5174',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout = 60000,
    pingInterval = 25000
  } = options;

  io = new Server(server, {
    cors,
    pingTimeout,
    pingInterval,
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        socketLogger.warn('Socket connection attempt without token', {
          socketId: socket.id,
          ip: socket.handshake.address
        });
        return next(new Error('Authentication required'));
      }

      // TODO: Verify JWT token here
      // For now, extract user info from token (implement proper JWT verification)
      const userId = socket.handshake.auth.userId;
      
      if (!userId) {
        return next(new Error('Invalid token'));
      }

      socket.userId = userId;
      socket.correlationId = randomUUID();
      
      socketLogger.info('Socket authenticated', {
        socketId: socket.id,
        userId,
        correlationId: socket.correlationId
      });

      next();
    } catch (error) {
      socketLogger.error('Socket authentication error', {
        error: error.message,
        socketId: socket.id
      });
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    handleConnection(socket);
  });

  socketLogger.info('Socket.IO initialized successfully', {
    cors: cors.origin,
    transports: ['websocket', 'polling']
  });

  return io;
}

/**
 * Handle new socket connection
 */
function handleConnection(socket) {
  const userId = socket.userId;
  
  socketLogger.info('Client connected', {
    socketId: socket.id,
    userId,
    correlationId: socket.correlationId
  });

  // Track connected user
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId).add(socket.id);
  socketToUser.set(socket.id, userId);

  // Update presence
  updateUserPresence(userId, 'online', {
    connectedAt: new Date().toISOString()
  });

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Emit connection success
  socket.emit('connected', {
    socketId: socket.id,
    userId,
    timestamp: new Date().toISOString()
  });

  // Broadcast user online status to relevant users
  broadcastPresence(userId, 'online');

  // Handle room joining
  socket.on('join:room', (roomId, callback) => {
    handleJoinRoom(socket, roomId, callback);
  });

  // Handle room leaving
  socket.on('leave:room', (roomId, callback) => {
    handleLeaveRoom(socket, roomId, callback);
  });

  // Handle direct messages
  socket.on('message:send', (data, callback) => {
    handleSendMessage(socket, data, callback);
  });

  // Handle typing indicators
  socket.on('typing:start', (roomId) => {
    handleTypingStart(socket, roomId);
  });

  socket.on('typing:stop', (roomId) => {
    handleTypingStop(socket, roomId);
  });

  // Handle presence updates
  socket.on('presence:update', (status, metadata) => {
    handlePresenceUpdate(socket, status, metadata);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    handleDisconnection(socket, reason);
  });

  // Error handler
  socket.on('error', (error) => {
    socketLogger.error('Socket error', {
      socketId: socket.id,
      userId,
      error: error.message
    });
  });
}

/**
 * Handle joining a room
 */
function handleJoinRoom(socket, roomId, callback) {
  try {
    socket.join(roomId);
    
    socketLogger.info('User joined room', {
      socketId: socket.id,
      userId: socket.userId,
      roomId
    });

    // Notify room members
    socket.to(roomId).emit('room:user-joined', {
      userId: socket.userId,
      roomId,
      timestamp: new Date().toISOString()
    });

    if (callback) {
      callback({
        success: true,
        roomId,
        message: 'Joined room successfully'
      });
    }
  } catch (error) {
    socketLogger.error('Failed to join room', {
      socketId: socket.id,
      userId: socket.userId,
      roomId,
      error: error.message
    });

    if (callback) {
      callback({
        success: false,
        error: error.message
      });
    }
  }
}

/**
 * Handle leaving a room
 */
function handleLeaveRoom(socket, roomId, callback) {
  try {
    socket.leave(roomId);
    
    socketLogger.info('User left room', {
      socketId: socket.id,
      userId: socket.userId,
      roomId
    });

    // Notify room members
    socket.to(roomId).emit('room:user-left', {
      userId: socket.userId,
      roomId,
      timestamp: new Date().toISOString()
    });

    if (callback) {
      callback({
        success: true,
        roomId,
        message: 'Left room successfully'
      });
    }
  } catch (error) {
    socketLogger.error('Failed to leave room', {
      socketId: socket.id,
      userId: socket.userId,
      roomId,
      error: error.message
    });

    if (callback) {
      callback({
        success: false,
        error: error.message
      });
    }
  }
}

/**
 * Handle sending a message
 */
async function handleSendMessage(socket, data, callback) {
  try {
    const { roomId, recipientId, content, type = 'text', metadata = {} } = data;
    
    const message = {
      id: randomUUID(),
      senderId: socket.userId,
      content,
      type,
      metadata,
      timestamp: new Date().toISOString()
    };

    if (roomId) {
      // Broadcast to room
      io.to(roomId).emit('message:received', {
        ...message,
        roomId
      });
      
      socketLogger.info('Message sent to room', {
        messageId: message.id,
        senderId: socket.userId,
        roomId
      });
    } else if (recipientId) {
      // Send to specific user
      io.to(`user:${recipientId}`).emit('message:received', {
        ...message,
        recipientId
      });
      
      socketLogger.info('Direct message sent', {
        messageId: message.id,
        senderId: socket.userId,
        recipientId
      });
    }

    // TODO: Persist message to database

    if (callback) {
      callback({
        success: true,
        message
      });
    }
  } catch (error) {
    socketLogger.error('Failed to send message', {
      socketId: socket.id,
      userId: socket.userId,
      error: error.message
    });

    if (callback) {
      callback({
        success: false,
        error: error.message
      });
    }
  }
}

/**
 * Handle typing start
 */
function handleTypingStart(socket, roomId) {
  socket.to(roomId).emit('typing:user-typing', {
    userId: socket.userId,
    roomId
  });
}

/**
 * Handle typing stop
 */
function handleTypingStop(socket, roomId) {
  socket.to(roomId).emit('typing:user-stopped', {
    userId: socket.userId,
    roomId
  });
}

/**
 * Handle presence update
 */
function handlePresenceUpdate(socket, status, metadata = {}) {
  updateUserPresence(socket.userId, status, metadata);
  broadcastPresence(socket.userId, status, metadata);
}

/**
 * Handle disconnection
 */
function handleDisconnection(socket, reason) {
  const userId = socket.userId;
  
  socketLogger.info('Client disconnected', {
    socketId: socket.id,
    userId,
    reason
  });

  // Remove socket tracking
  if (connectedUsers.has(userId)) {
    const userSockets = connectedUsers.get(userId);
    userSockets.delete(socket.id);
    
    // If user has no more connections, mark as offline
    if (userSockets.size === 0) {
      connectedUsers.delete(userId);
      updateUserPresence(userId, 'offline');
      broadcastPresence(userId, 'offline');
    }
  }
  
  socketToUser.delete(socket.id);
}

/**
 * Update user presence
 */
function updateUserPresence(userId, status, metadata = {}) {
  userPresence.set(userId, {
    status,
    lastSeen: new Date().toISOString(),
    metadata
  });
}

/**
 * Broadcast presence to relevant users
 */
function broadcastPresence(userId, status, metadata = {}) {
  io.emit('presence:updated', {
    userId,
    status,
    timestamp: new Date().toISOString(),
    metadata
  });
}

/**
 * Get user presence
 */
export function getUserPresence(userId) {
  return userPresence.get(userId) || {
    status: 'offline',
    lastSeen: null
  };
}

/**
 * Get all connected users
 */
export function getConnectedUsers() {
  return Array.from(connectedUsers.keys());
}

/**
 * Send message to specific user
 */
export function sendToUser(userId, event, data) {
  if (!io) {
    socketLogger.error('Socket.IO not initialized');
    return false;
  }

  io.to(`user:${userId}`).emit(event, data);
  return true;
}

/**
 * Send message to room
 */
export function sendToRoom(roomId, event, data) {
  if (!io) {
    socketLogger.error('Socket.IO not initialized');
    return false;
  }

  io.to(roomId).emit(event, data);
  return true;
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(event, data) {
  if (!io) {
    socketLogger.error('Socket.IO not initialized');
    return false;
  }

  io.emit(event, data);
  return true;
}

/**
 * Get Socket.IO instance
 */
export function getIO() {
  return io;
}

/**
 * Graceful shutdown
 */
export async function shutdown() {
  if (!io) {
    return;
  }

  socketLogger.info('Shutting down Socket.IO...');
  
  // Notify all clients
  io.emit('server:shutdown', {
    message: 'Server is shutting down',
    timestamp: new Date().toISOString()
  });

  // Close all connections
  io.close(() => {
    socketLogger.info('Socket.IO shut down successfully');
  });

  io = null;
  connectedUsers.clear();
  socketToUser.clear();
  userPresence.clear();
}

export default {
  initializeSocket,
  getUserPresence,
  getConnectedUsers,
  sendToUser,
  sendToRoom,
  broadcast,
  getIO,
  shutdown
};
