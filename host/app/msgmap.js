// the message map just enriches or reduces the commands/events
// received from browser / redis with additional
// information like sender and timestamp

const map = {

  to: {

    channelNeedsCustom(channel, sender, message) {
      const msg = {
        id: message.id,
        command: message.command,
        sender,
        payload: message.payload,
      };
      return JSON.stringify(msg, null, 4);
    },

    default(channel, sender, message) {
      const msg = {
        id: message.id,
        command: message.command,
        time: new Date(),
        sender,
        payload: message.payload,
      };
      return JSON.stringify(msg, null, 4);
    },
  },

  from: {

    channelNeedsCustom(channel, message) {
      const msg = JSON.parse(message);
      const data = {
        id: msg.id,
        event: msg.event,
        payload: msg.payload,
      };
      return data;
    },

    default(channel, message) {
      const msg = JSON.parse(message);
      const data = {
        id: msg.id,
        event: msg.event,
        payload: msg.payload,
      };
      return data;
    },
  },

};

exports.to = function to(channel, sender, message) {
  if (map.to[channel]) {
    return map.to[channel](channel, sender, message);
  }
  return map.to.default(channel, sender, message);
};

exports.from = function from(channel, message) {
  if (map.from[channel]) {
    return map.from[channel](channel, message);
  }
  return map.from.default(channel, message);
};
