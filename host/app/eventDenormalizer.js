// the eventdenormalizer handles events and updates the viewmodel.

const store = require('./storage');

const eventHandler = {

    // pass events to matching functions to:
    //
    // - create an item
    // - change an item
    // - delete an item
  handle(evt) {
    eventHandler[evt.event](evt);
  },

  itemCreated(evt) {
    store.save({ id: evt.payload.id, text: evt.payload.text }, (err) => {
      console.log(err);
    });
  },

  itemChanged(evt) {
    store.load(evt.payload.id, (err, item) => {
      item.text = evt.payload.text;
      store.save(item, (saveError) => {
        console.log(saveError);
      });
    });
  },

  itemDeleted(evt) {
    store.del(evt.payload.id, (err) => {
      console.log(err);
    });
  },

};

exports.handle = eventHandler.handle;
