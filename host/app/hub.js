// the hub encapsulates functionality to send or receive messages from redis.

const redis = require('redis');
const colors = require('./colors');
const map = require('./msgmap');

const cmd = redis.createClient('redis');
const evt = redis.createClient('redis');
const subscriptions = [];

// send commands to redis __commands channel__
exports.emit = function emit(commandName, sender, message) {
  const data = map.to(commandName, sender, message);
  console.log(colors.blue(`\nhub -- publishing command ${commandName} to redis:`));
  console.log(data);
  cmd.publish('commands', data);
};

// store subscriptions for a channel (mostly __events__) in a array
exports.on = function on(channel, callback) {
  subscriptions.push({ channel, callback });
  console.log(colors.blue(`hub -- subscribers: ${subscriptions.length}`));
};

// listen to events from redis and call each callback from subscribers
evt.on('message', (channel, message) => {
  const data = map.from(channel, message);
  console.log(colors.green(`\nhub -- received event ${data.event} from redis:`));
  console.log(message);

  subscriptions.forEach((subscriber) => {
    if (channel === subscriber.channel) {
      subscriber.callback(data);
    }
  });
});

// subscribe to __events channel__
evt.subscribe('events');
