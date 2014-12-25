'use strict';

module.exports = function(socket){
  socket.emit('online');
  socket.on('globalChat', require('./globalChat'));
  socket.on('globalImage', require('./globalImage'));
  socket.on('spotlightChosen', require('./spotlightNotification'));
};
