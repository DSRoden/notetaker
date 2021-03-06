(function(){
    'use strict';

    angular.module('hapi-auth')
        .controller('HomeCtrl', ['$rootScope', '$scope', '$state', 'User', 'Message', 'Photo', function($rootScope, $scope, $state, User, Message, Photo){
            $scope.message = {};
            $scope.messages = [];
            $scope.updates = [];
            $scope.winner = {};
            $scope.lotteryNum = null;
            $scope.winner = null;
            $scope.showAdmin = false;
            $scope.showWinner = false;
            $scope.spotlight = {};
            $scope.confirmed = false;
            $scope.validated = false;

            //photo testing
            $scope.photos =[];
            //$scope.photos.push({time: '2014-12-24T19:56:25.745Z', url: 'https://s3.amazonaws.com/dsroden-spotlight/6/7e63a…a51376956c3af47f78230195e3db8f9a572aa57a64c9c.jpg'});
            //$scope.photos.push({time: '2014-12-24T20:40:29.793Z', url: 'https://cdn3.iconfinder.com/data/icons/pictofoundry-pro-vector-set/512/Avatar-512.png'});

            //merge photos and messages
            $scope.merge = function(){
              $scope.updates = _.union($scope.photos, $scope.messages);
            };

            if(!$rootScope.rootuser){

            //make a call to db to get all photos for current day
            Photo.getAll().then(function(response){
              $scope.photos = response.data;
            });

            //make a call to db to get all messages for current day
            Message.getAll().then(function(response){
              //console.log(response);
              $scope.messages = response.data;
              $scope.merge();
            });

            } else {

                //make a call to db to get all photos for current day
                Photo.getAllAuthenticated().then(function(response){
                  console.log('response from photos auth', response);
                  $scope.photos = response.data;
                });
                console.log('authenticated');
                //make a call to db to get all messages for current day
                Message.getAllAuthenticated().then(function(response){
                  console.log(response);
                  $scope.messages = response.data;
                  $scope.merge();
                });
            }

            //when a message is liked
            $scope.like = function(update){
              console.log('update that is being liked', update);
              //emit to db to update the count of likes for that message
               update.liked = 'yes';
               if(update.content){
                $scope.messageLiked($rootScope.rootuser.id, update.id);
               } else if(update.url){
                $scope.imageLiked($rootScope.rootuser.id, update.id);
               }

            };

            //function to emit when a message is liked
            $scope.messageLiked = function(userId, messageId){
              console.log('emmitting message liked with user id and message id' + userId +', ' + messageId);
              socket.emit('messageLiked', {userId: userId, messageId: messageId});
            };

            //function to emit when a message is liked
            $scope.imageLiked = function(userId, imageId){
              console.log('emmitting message liked with user id and message id' + userId +', ' + imageId);
              socket.emit('messageLiked', {userId: userId, imageId: imageId});
            };

            //when a message has been liked
            socket.on('newLike', function(data){
              //gets back the entire message, including id and new likes count
              console.log('newlike from sockets', data);
              //reset it's likes to a new count
              $scope.$apply(function(){
                for(var i = 0; i < $scope.updates.length; i++){
                  if($scope.updates[i].id === data.id){$scope.updates[i].likes = data.likes;}
                }
              });
            });

            //check to see if rootuser is in the spotlight
            User.isSpotlightOn().then(function(response){
              //console.log('response from isSpotlightOn', response);
              $scope.confirmed = (response.data.confirmed) ? true : false;
              $scope.validated = (response.data.validated) ? true : false;
              if($scope.validated){$scope.confirmed = false;}
            });


            //validate the winner's password
            $scope.validate = function(){
              //console.log('validating password button clicked');
              User.validateSpotlight($scope.spotlight.password).then(function(response){
                //console.log(response);
                if(response.data.validated){
                  $scope.validated = true;
                  $scope.confirmed = false;
                }
                //console.log('rootuser', $rootScope.rootuser);
              });
            };

            //manual lottery
            $scope.runLottery = function(){
              //run function if rootuse is admin - cosmetic since real validation runs on server
              if($rootScope.rootuser.id !== 1){return;}
              User.runLottery().then(function(response){
                //console.log('getting all users, in scope', response);
                //console.log('response from lotter', response);
                if(response.data !== ''){
                  $scope.showAdmin = true;
                }
                $scope.winner = response.data;
              });
            };

            //select a lottery winner on load
            if($rootScope.rootuser){$scope.runLottery();}

            //set winner as spotlight
            $scope.selectWinner = function(id){
              //console.log(id);
              User.selectWinner(id).then(function(response){
                //console.log(response);
                $scope.winner = response.data;
                //console.log($scope.winner.id);
                //create winner variable and emit info
                var winner = $scope.winner;
                //console.log('winner received and being emitted', winner);
                socket.emit('spotlightChosen', {winner: winner});
              });
            };

            $scope.winnerInfo = function(){
              $scope.showWinner = ($scope.showWinner) ? false : true;
            };


            //notify the winner with an email and a password
            $scope.notifyWinner = function(){
              User.notifyWinner($scope.winner.id).then(function(){
                console.log('winner notified successfully');
              }, function(){
                console.log('failed to notify winner');
              });
            };


            //show winner password option
            socket.on('areYouTheSpotlight', function(data){
              $scope.selectedUser = data.winner.id;
              console.log('spotlight id', $scope.selectedUser);
              console.log('current user id', $rootScope.rootuser.id);
              if($rootScope.rootuser.id === $scope.selectedUser){
                  console.log('inside are you the spotlight if statement');
                  $scope.$apply(function(){
                    $scope.confirmed = true;
                    $scope.validated = false;
                  });
              } else {
                $scope.$apply(function(){
                  $scope.confirmed = false;
                  $scope.validated = false;
                  $scope.messages = [];
                });
              }
            });


            //sending messages, need to be validated as spotlight
            $scope.chat = function(msg){
                socket.emit('globalChat', {id: $scope.rootuser.id, content:msg});
                $scope.$apply(function(){
                  $scope.message = '';
                });
            };

            //getting message back from sockets
            socket.on('bGlobalChat', function(data){
                //console.log('message from sockets', data);
                $scope.updates.unshift(data);
                // $scope.messages = $scope.messages.slice(0, 100);
                $scope.message = null;
                $scope.$digest();
            });

            socket.on('bGlobalImage', function(data){
              console.log('image from sockets', data);
              $scope.updates.unshift(data);
              $scope.$digest();
            });


        }]);
})();
