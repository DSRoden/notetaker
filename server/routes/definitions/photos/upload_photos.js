'use strict';

var Photo = require('../../../models/photo');

module.exports = {
  description: 'Upload a Photo',
  tags:['photos'],
  payload:{
      maxBytes: 40500500
  },
  handler: function(request, reply){
    //console.log('inside handler, request', request.payload);


    Photo.uploadmobile(request.auth.credentials, request.payload.b64, function(imageObj){
      if(!imageObj){reply().code(400);}
      console.log('image object returning to definitions', imageObj);
      reply(imageObj).code(200);
    });
  }
};
