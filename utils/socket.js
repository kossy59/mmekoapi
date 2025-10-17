// Get the existing socket.io instance from the main server
let io = null;

// Set the socket.io instance (called from index.js)
const setSocketIO = (socketInstance) => {
  io = socketInstance;
  console.log('🔌 Socket.io instance set in utils');
};

// Get socket instance
const getSocketIO = () => {
  return io;
};

// Emit fan meet status update
const emitFanRequestStatusUpdate = (data) => {
  const socketIO = getSocketIO();
  if (socketIO) {
    socketIO.emit('fan_request_status_update', data);
    console.log('📡 [Socket] Emitted fan request status update:', data);
  }
};

module.exports = {
  setSocketIO,
  getSocketIO,
  emitFanRequestStatusUpdate
};
