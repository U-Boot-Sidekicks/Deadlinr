var moment = require('moment');
var models = require('../models.js');
var Deadline = models.Deadline;
var Wall = models.Wall;

exports.index = function(req, res){
  var wall_id = req.params.wall_id;
  var now = new Date();

  var query = Deadline.find({
    expires: { $gt:now.toISOString() },
    wallId: wall_id
  });
  query.sort({ 'expires':1 });
  query.limit(10);
  query.exec(function(err, deadlines) {
    if (err) {
      console.log(err);
      res.redirect('/deadlinr/start');
    } else {
        deadlines.forEach(calculateRemainingDays);

        var events = [];
        Deadline.find({ expires:{ $gt:now.toISOString() }, wallId: wall_id }, '_id title expires', function(err, results){
          if (!err) {
            results.forEach(function(item) {
              events.push({
                'title':item.title,
                'date':moment(item.expires).format('YYYY-MM-DD')
              });
            });
          }

          res.render('index', {
            title: 'Deadlinr: Upcoming deadlines visualization',
            wall_id: wall_id,
            highlights: deadlines.slice(0, 4),
            other: deadlines.slice(4, deadlines.length),
            events: events
          });
        });
    }
  });
};

exports.all = function(req, res) {
  var wall_id = req.params.wall_id;
  var page = req.params.page;
  var PER_PAGE = 5;

  Deadline.count({
    wallId: wall_id
  }, function(err, count){
    if (err) {
      console.log('Failed to FETCH ALL');
      console.log(err);
      res.redirect('/deadlinr/start');
    }

    var pages = Math.ceil(count/PER_PAGE);
    page = parseInt(page);
    if (page === undefined || isNaN(page) || page < 1) {
      page = 1;
    }
    if (page > pages) {
      page = pages;
    }

    var skip = (page - 1) * PER_PAGE;
    var limit = PER_PAGE;

    if (skip < 0) skip = 0;

    Deadline.find({
      wallId: wall_id
    }, null, {
      sort: {
        expires: 1
      },
      skip: skip,
      limit: limit
    }, function(err, results) {
      results.forEach(calculateRemainingDays);

      var params = {
        deadlines: results,
        wall_id: wall_id
      };
      if (page > 1) {
        params.page_prev = page - 1;
      }
      if (page + 1 <= pages) {
        params.page_next = page + 1;
      }
      res.render('all', params);
    });
  });
};

function calculateRemainingDays(deadline) {
  var date = deadline.expires;
  var today = Date.now();
  var remainingDays = Math.ceil((date - today) / 86400000);
  var remainingHours = Math.ceil((date - today) / 3600000);
  var prefix = '';
  var postfix = '';

  if (remainingDays <= 14){
    deadline.colorAlert = "alert-error";
    deadline.colorProgress = "bar-danger";
    deadline.colorLabel = "label-important";
  }
  else if (remainingDays <= 60){
    deadline.colorAlert = "";
    deadline.colorProgress = "bar-warning";
    deadline.colorLabel = "label-warning";
  }
  else{
    deadline.colorAlert = "alert-success";
    deadline.colorProgress = "bar-success";
    deadline.colorLabel = "label-success";
  }

  if (remainingDays > 14)
    prefix = 'still'
  else
    prefix = 'only';


  if (remainingDays > 1) {
    postfix = 'days left.';
    deadline.smallTitle = prefix + ' ' + remainingDays + ' ' + postfix;
  } else {
    if (remainingHours > 1)
      postfix = ' hours left!';
    else
      postfix = ' hour left!';
    deadline.smallTitle = prefix + ' ' + remainingHours + ' ' + postfix;
  }

  deadline.remainingHours = remainingHours;
  deadline.remainingDays = remainingDays;

  if (remainingDays > 60)
    progressBarAhead = 100
  else
    progressBarAhead = Math.floor(remainingDays / 60 * 100);

  progressBarAgo = 100 - progressBarAhead;

  deadline.progressBarAgo = progressBarAgo;
  deadline.progressBarAhead = progressBarAhead;


  deadline.expires_formatted = moment(date).format('DD. MMMM YYYY, HH:mm');

}