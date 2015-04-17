var express = require("express");
var vhost = require("vhost");
var http = require('http');
var io = require('socket.io');
var Nrp = require('node-redis-pubsub');

var main = express();
var server = http.createServer(main);

var nrp_config = { port: 6379 };

io.listen(server).on('connection', function(client) {
    
    var client_app_key = client.handshake.query.public_key,
        client_channel = client.handshake.query.channel,
        client_scope = client_app_key+':'+client_channel;
    
    console.log('Client Connected: '+client_app_key);
    
    var nrp = new Nrp(nrp_config);

    nrp.on(client_scope+':*', function(data, channel) {
        var events = channel.split(':'),
            emitEvent = events[ events.length - 1 ];

        client.emit(emitEvent, data);
        console.log('Event Emitted: '+emitEvent+' for Client: '+client_app_key);
    });

    client.on('disconnect', function() {
        console.log('Client Disconnected: '+client_app_key);
        nrp.off(client_scope+':*');
        nrp.quit();
    });
});

var app = module.exports = express();
app.use(vhost('butler-client.local', main));
server.listen(9999);