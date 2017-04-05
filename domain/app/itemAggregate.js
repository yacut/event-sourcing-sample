// the itemAggregate is the aggregationRoot for a single item all commands concerning this
// aggregate are handled inside this object.

// the itemAggregate has an internal state (id, text, destoyed)
const Item = function Item(id) {
  this.id = id;
  this.text = '';
  this._destroy = false;
  this.uncommittedEvents = [];
};

Item.prototype = {

    // each __command__ is mapped to an aggregate function
    // after validation the __event__ is applied to the object itself (changing
    // the internal state of the aggregate)
    //
    // when all operations are done the callback will be called.
  createItem(evt, callback) {
    evt.payload.id = this.id;

    if (evt.payload.text === '') {
      callback(new Error('It is not allowed to set an item text to empty string.'));
    } else {
      this.apply(evt);
      callback(null, this.uncommittedEvents);
    }
  },

  changeItem(evt, callback) {
    if (evt.payload.text === '') {
      callback(new Error('It is not allowed to set an item text to empty string.'));
    } else {
      this.apply(evt);
      callback(null, this.uncommittedEvents);
    }
  },

  deleteItem(evt, callback) {
    this.apply(evt);
    callback(null, this.uncommittedEvents);
  },

    // apply the event to the aggregate calling the matching function
  apply(evt) {
    this[`_${evt.event}`](evt);

    if (!evt.fromHistory) {
      this.uncommittedEvents.push(evt);
    }
  },

  _itemCreated(evt) {
    this.text = evt.payload.text;
  },

  _itemChanged(evt) {
    this.text = evt.payload.text;
  },

  _itemDeleted() {
    this._destroy = true;
  },

  // function to reload an itemAggregate from it's past events by
  // applying each event again
  loadFromHistory(history) {
    for (let i = 0, len = history.length; i < len; i++) {
      e = history[i].payload;
      e.fromHistory = true;
      this.apply(e);
    }
  },

};

// export the modules function to create a new itemAggregate
exports.create = function create(id) {
  return new Item(id);
};
