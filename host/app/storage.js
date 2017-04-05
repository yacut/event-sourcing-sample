// simple storage for loading, changing and deleting items

const redis = require('redis');
const async = require('async');

const db = redis.createClient();

const store = {

  load(id, callback) {
    db.get(`readmodel:${id}`, (err, data) => {
      if (err) callback(err);

      callback(null, JSON.parse(data));
    });
  },

  loadAll(callback) {
    db.smembers('readmodel:items', (err, keys) => {
      if (err) callback(err);

      async.map(keys, store.load, (mapError, items) => {
        if (mapError) callback(mapError);

        callback(null, items);
      });
    });
  },

  save(item, callback) {
    db.sismember('readmodel:items', item.id, (err, exists) => {
      if (err) callback(err);

      if (!exists) db.sadd('readmodel:items', item.id);

      db.set(`readmodel:${item.id}`, JSON.stringify(item));

      callback(null);
    });
  },

  del(id, callback) {
    db.srem('readmodel:items', id, (err) => {
      if (err) callback(err);

      db.del(id, (deleteError) => {
        if (deleteError) callback(deleteError);

        callback(null);
      });
    });
  },
};

module.exports = store;
