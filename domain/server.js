// server.js is the starting point of the domain process:
//
// `node server.js`
const redis = require('redis');
const colors = require('./app/colors');
const handler = require('./app/commandHandler');

// create a connection to local redis server
const cmd = redis.createClient('6379', 'redis');

// on receiving a message (__=command__) from redis pass it to
// the commandHandler calling the handle function
cmd.on('message', (channel, message) => {
  console.log(colors.blue('\nreceived command from redis:'));
  console.log(message);

  console.log(colors.cyan('\n-> handle command'));
  handler.handle(JSON.parse(message));
});

// subscribe to channel _commands_ on redis pubsub
cmd.subscribe('commands');

console.log('Starting domain service'.cyan);
