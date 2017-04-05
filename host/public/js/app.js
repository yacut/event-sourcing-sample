(function () {
  // Create Backbone Model and Collection
  // ------------------------------------

  // model
  const Item = Backbone.Model.extend({
    modelName: 'item', // so denormalizers can resolve events to model

    initialize() {
      // bind this model to get event updates - a lot of magic ;)
      // not more to do the model gets updated now
      this.bindCQRS();
    },
  });

  // collection
  const Items = Backbone.Collection.extend({
    model: Item,
    url: '/allItems.json',
  });

  const items = new Items();


  // Init Backbone.CQRS
  // ------------------

  // we just have to override eventNameAttr:
  Backbone.CQRS.hub.init({ eventNameAttr: 'event' });

  // override Backbone.sync with CQRS.sync which allows only GET method
  Backbone.sync = Backbone.CQRS.sync;


  // Wire up communication to/from server
  // ------------------------------------

  // create a socket.io connection
  const socket = io.connect('http://localhost:3000');

  // on receiving an event from the server via socket.io
  // forward it to backbone.CQRS.hub
  socket.on('events', (evt) => {
    Backbone.CQRS.hub.emit('events', evt);
  });

    // forward commands to server via socket.io
  Backbone.CQRS.hub.on('commands', (cmd) => {
    socket.emit('commands', cmd);
  });


  // Create a few EventDenormalizers
  // -------------------------------

  // itemCreated event
  const itemCreateHandler = new Backbone.CQRS.EventDenormalizer({
    methode: 'create',
    model: Item,
    collection: items,

      // bindings
    forModel: 'item',
    forEvent: 'itemCreated',
  });

  // itemChanged event
  const itemChangedHandler = new Backbone.CQRS.EventDenormalizer({
    forModel: 'item',
    forEvent: 'itemChanged',
  });

  // itemDeleted event
  const itemDeletedHandler = new Backbone.CQRS.EventDenormalizer({
    methode: 'delete',

        // bindings
    forModel: 'item',
    forEvent: 'itemDeleted',
  });


  // Create Backbone Stuff
  // ---------------------

  // view templates
  const itemTemplate = _.template('<%= text %> <a class="deleteItem" href="">delete</a> <a class="editItem" href="">edit</a>');
  const editItemTemplate = _.template('<input id="newText" type="text" value="<%= text %>"></input><button id="changeItem">save</button>');

  // views
  const ItemView = Backbone.View.extend({

    tagName: 'li',
    className: 'item',

    initialize() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    events: {
      'click .editItem': 'uiEditItem',
      'click .deleteItem': 'uiDeleteItem',
      'click #changeItem': 'uiChangeItem',
    },

    // render edit input
    uiEditItem(e) {
      e.preventDefault();
      this.model.editMode = true;
      this.render();
    },

    // send deletePerson command with id
    uiDeleteItem(e) {
      e.preventDefault();

      // CQRS command
      const cmd = new Backbone.CQRS.Command({
        id: _.uniqueId('msg'),
        command: 'deleteItem',
        payload: {
          id: this.model.id,
        },
      });

      // emit it
      cmd.emit();
    },

    // send changeItem command with new name
    uiChangeItem(e) {
      e.preventDefault();

      const itemText = this.$('#newText').val();

      this.$('#newText').val('');
      this.model.editMode = false;
      this.render();

      if (itemText) {
        // CQRS command
        const cmd = new Backbone.CQRS.Command({
          id: _.uniqueId('msg'),
          command: 'changeItem',
          payload: {
            id: this.model.id,
            text: itemText,
          },
        });

                // emit it
        cmd.emit();
      }
    },

    render() {
      if (this.model.editMode) {
        $(this.el).html(editItemTemplate(this.model.toJSON()));
      } else {
        $(this.el).html(itemTemplate(this.model.toJSON()));
      }
      return this;
    },

    remove() {
      $(this.el).fadeOut('slow');
    },

  });

  const IndexView = Backbone.View.extend({

    el: '#index-view',

    initialize() {
      _.bindAll(this, 'addItem');

      this.collection = app.items;
      this.collection.bind('reset', this.render, this);
      this.collection.bind('add', this.addItem, this);
    },

    events: {
      'click #addItem': 'uiAddItem',
    },

        // send createPerson command
    uiAddItem(e) {
      e.preventDefault();

      const itemText = this.$('#newItemText').val();

      if (itemText) {
                // CQRS command
        const cmd = new Backbone.CQRS.Command({
          id: _.uniqueId('msg'),
          command: 'createItem',
          payload: { text: itemText },
        });

                // emit it
        cmd.emit();
      }

      this.$('#newItemText').val('');
    },

    render() {
      this.collection.each(this.addItem);
    },

    addItem(item) {
      const view = new ItemView({ model: item });
      this.$('#items').append(view.render().el);
    },

  });


    // Bootstrap Backbone
    // ------------------

  var app = {};
  const init = function () {
    app.items = items;
    app.items.fetch();

    const indexView = new IndexView();
    indexView.render();
  };

    // kick things off
  $(init);
}());
