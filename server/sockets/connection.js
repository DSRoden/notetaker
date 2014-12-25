'use strict';

module.exports = function(socket){
  socket.emit('online');
  socket.on('globalChat', require('./globalChat'));
  socket.on('spotlightChosen', require('./spotlightNotification'));
  socket.on('image', require('./globalImage'));
};
