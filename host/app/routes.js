const store = require('./storage');

exports.actions = function actions(app) {
  app.get('/', (req, res) => {
    res.render('index');
  });

  app.get('/allItems.json', (req, res) => {
    store.loadAll((err, items) => {
      if (err) res.json({});

      res.json(items);
    });
  });
};
