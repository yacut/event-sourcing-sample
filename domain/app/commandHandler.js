// here all the magic happens to handle a command:
//
// - pass it to aggregation root
// - store the event to storage
// - publishing event back to redis

const redis = require('redis');
const colors = require('./colors');
const async = require('async');
const items = require('./itemAggregate');
const eventstore = require('eventstore');

// create a redis client - we will use this later to get new aggregateIds
// const db = redis.createClient();

// create a publisher which we use later to publish committed events back.
// just use another redis client and publish events to the _events channel_
const publisher = {

  evt: redis.createClient(),

  publish(evt) {
    const msg = JSON.stringify(evt, null, 4);

    console.log(colors.green('\npublishing event to redis:'));
    console.log(msg);

    publisher.evt.publish('events', msg);
  },

};

// for _EventSourcing_ we use [nodeEventStore](https://github.com/KABA-CCEAC/nodeEventStore):
//
// just create an instance and use one of the provided database providers
const es = eventstore({ type: 'redis' });

// configure the eventstore to use it and also inject the publisher implementation.
//
// finally start the eventstore instance so it will publish committed events to the provided
// publisher.
es.useEventPublisher(publisher.publish);
es.init();

// for simplicity just map command names to event names.
// remove the command and change the message's id.
// in fact we just send back the received data with minor changes
const map = {

  mappings: {
    createItem: 'itemCreated',
    changeItem: 'itemChanged',
    deleteItem: 'itemDeleted',
  },

  toEvent(cmd) {
    cmd.id = `${cmd.id}_event_0`;
    cmd.event = map.mappings[cmd.command] ? map.mappings[cmd.command] : 'unknown';
    delete cmd.command;
    return cmd;
  },
};


// the commandHandler does the heavy lifting:
const commandHandler = {

  handle(cmd) {
    const cmdName = cmd.command;
    const id = cmd.payload.id;
    // __don't do this at home:
    // __ for simplicity we create the event already outside the aggregate - in a real system
    // you should create the event inside the aggregate (success or error), but as we only mirroring
    // the command back we take this shortcut.
    const evt = map.toEvent(cmd);

    evt.time = new Date();

    async.waterfall([

      // create an instance of itemAggregate
      // if the command provides no id (=createItem) - get a new id from redis db
      function createItemAggregateInstance(callback) {
        if (!id) {
          es.getNewId((err, getId) => {
            const newId = `item:${getId}`;

            console.log(colors.cyan(`create a new aggregate with id= ${newId}`));

            callback(null, items.create(newId));
          });
        } else {
          console.log(colors.cyan(`create existing aggregate with id= ${id}`));

          callback(null, items.create(id));
        }
      },

      // load the eventstream (history) for the given id from eventstore
      function loadEventStream(item, callback) {
        console.log(colors.cyan(`load history for id= ${item.id}`));
        es.getEventStream(item.id, (err, stream) => {
          callback(null, item, stream);
        });
      },

      // handle the command on aggregate
      //
      // - call loadFromHistory to apply all past events
      // - call the function matching the commandName
      // - add the uncommitted event to the eventstream and commit it
      //   the event will be published in eventstore after successful commit
      function handleAggregateCommand(item, stream, callback) {
        console.log(colors.cyan(`apply existing events ${stream.events.length}`));
        item.loadFromHistory(stream.events);


        console.log(colors.magenta(`apply new event ${evt.event} to aggregate`));
        item[cmdName](evt, (err, uncommitted) => {
          if (err) {
            console.log(colors.red(err));
          } else {
            stream.addEvent(uncommitted[0]);
            stream.commit();
          }
        });
        callback();
      },

    ]);
  },

};

exports.handle = commandHandler.handle;
