
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    deadline = require('./routes/deadline'),
    mongoose = require('mongoose'),
    http = require('http'),
    path = require('path');

var app = express();

mongoose.connect('mongodb://localhost/deadlinr');

app.engine('html', require('hogan-express'));

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('asd98fas7d9f8as7d9f8a7sd9f8as7d9f8as7df9as87df'));
  app.use(express.session());
  app.use(app.router);
  app.use('/deadlinr', express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.set('domain', '127.0.0.1');
  app.set('port', process.env.PORT || 9997);
  app.use(express.errorHandler());
});

app.get('/', deadline.start);
app.get('/deadlinr', deadline.start);
app.get('/deadlinr/start', deadline.start);
app.post('/deadlinr/start', deadline.start_posted);
app.get('/deadlinr/wall/:wall_id', routes.index);
app.get('/deadlinr/wall/:wall_id/all/:page?', routes.all);
app.get('/deadlinr/wall/:wall_id/view/:id', deadline.view);
app.get('/deadlinr/wall/:wall_id/add', deadline.add);
app.post('/deadlinr/wall/:wall_id/add', deadline.add_posted);
app.get('/deadlinr/wall/:wall_id/edit/:id', deadline.edit);
app.get('/deadlinr/wall/:wall_id/delete/:id', deadline.drop);
app.post('/deadlinr/wall/:wall_id/edit/:id', deadline.edit_posted);
app.get('/deadlinr/wall/:wall_id/aggregation.tsv', deadline.aggregation);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
