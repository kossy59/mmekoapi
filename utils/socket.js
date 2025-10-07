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
const emitFanMeetStatusUpdate = (data) => {
  const socketIO = getSocketIO();
  if (socketIO) {
    socketIO.emit('fan_meet_status_update', data);
    console.log('📡 [Socket] Emitted fan meet status update:', data);
  }
};

module.exports = {
  setSocketIO,
  getSocketIO,
  emitFanMeetStatusUpdate
};
