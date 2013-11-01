var models = require('../models.js');
var Deadline = models.Deadline;
var Wall = models.Wall;
var moment = require('moment');
var mongoose = require('mongoose');
var util = require('util');
var nodemailer = require('nodemailer');
nodemailer.SMTP = {
  host: 'localhost'
};

exports.start = function(req, res){
  res.render('start');
};

exports.start_posted = function(req, res){
  var body = req.body;
  var email = req.body.email;

  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!re.test(email)) {
    res.render('start', {
      error: true,
      params: req.body
    });
    return;
  }

  Wall.create({
    email: email
  }, function(err, data){
      if (err) {
        console.log('Failed to CREATE wall:');
        console.log(err);
        res.render('start', {
          error: true,
          params: req.body
        });
      }

      var msg = util.format("Greetings!,\n\nYour Deadlinr Wall has been created for you and is available at the following URL:\n%s\n\nKind regards,\nDeadlinr Team", data._id);
      nodemailer.send_mail({
        sender: 'noreply@deadlinr.com',
        to: email,
        subject: 'Deadlinr Wall is Created!',
        html: msg,
        body:msg
      },
      function(error, success){
        console.log(error);
        console.log(success);
        console.log('Message ' + success ? 'sent' : 'failed');
      });

      res.redirect('/deadlinr/wall/' + data._id);
  });
};

exports.view = function(req, res){
  var id = req.params.id;
  Deadline.findOne({ '_id': id }, function(err, data){
    if (err) {
      console.log('Failed to FIND ONE');
      console.log(err);
      res.redirect('/deadlinr');
    } else {
      res.render('view', { 'deadline': data });
    }
  });
};

exports.add = function(req, res){
  var wall_id = req.params.wall_id;
  res.render('add', { params:null, wall_id: wall_id });
};

exports.add_posted = function(req, res){
  var wall_id = req.params.wall_id;
  var body = req.body;
  var raw_tags = req.body.tags;
  var tags = raw_tags.split(",").map(function(item){ return item.replace(/^\s+|\s+$/g, "");});

  if (body.title.length < 5 && body.expires.length < 10) {
      res.render('add', {
        error: true,
        params: req.body,
        wall_id: wall_id
      });
  } else {
    Deadline.create({
      wallId: wall_id,
      title: req.body.title,
      url: req.body.url,
      expires: new Date(req.body.expires),
      tags: tags,
      location: req.body.location
    }, function(err, data) {
      if (err) {
        console.log('Failed to ADD deadline:');
        console.log(err);
        res.render('add', {
          error: true,
          params: req.body,
          wall_id: wall_id
        });
      }
      res.redirect('/deadlinr/wall/' + wall_id);
    });
  }
};

exports.edit = function(req, res){
  var wall_id = req.params.wall_id;
  var id = req.params.id;
  Deadline.findOne({ _id:id, wallId:wall_id }, function(err, data) {
    if (err) {
        console.log('Failed to FIND a deadline');
        console.log(err);
        res.redirect('/deadlinr/wall/' + wall_id);
    }
    res.render('edit', {
      params:data,
      expires:moment(data.expires).format('YYYY-MM-DD hh:mm'),
      wall_id:wall_id
    });
  });
};

exports.edit_posted = function(req, res){
  var wall_id = req.params.wall_id;
  var id = req.params.id;
  var body = req.body;
  var raw_tags = req.body.tags;
  var tags = raw_tags.split(",").map(function(item){ return item.replace(/^\s+|\s+$/g, "");});

  if (body.title.length < 5 && body.expires.length < 10) {
      res.render('edit', {
        error: true,
        params: req.body,
        expires:moment(data.expires).format('YYYY-MM-DD hh:mm'),
        wall_id:wall_id
      });
  } else {
    Deadline.findOneAndUpdate({
      _id: id,
      wallId:wall_id
    }, {
      title: req.body.title,
      url: req.body.url,
      expires: new Date(req.body.expires),
      tags: tags,
      location: req.body.location
    }, null, function(err, data) {
      if (err) {
        console.log('Failed to ADD deadline:');
        console.log(err);
        res.render('edit', {
          error: true,
          params: req.body,
          expires:moment(data.expires).format('YYYY-MM-DD hh:mm'),
          wall_id:wall_id
        });
      }
      res.redirect('/deadlinr/wall/' + wall_id + '/all');
    });
  }
};

exports.drop =function(req, res){
  var wall_id = req.params.wall_id;
  var id = req.params.id;
  Deadline.remove({ _id:id, wallId:wall_id }, function(err){
    res.redirect('/deadlinr/wall/' + wall_id + '/all');
  });
};

exports.aggregation = function(req, res){
  var wall_id = req.params.wall_id;
  var now = new Date();

  var handler = function(err, data) {
    if (err) {
        console.log('Failed to FETCH data');
        console.log(err);
        res.render('aggregation');
    }

    // Add data points from NOW till the first date form the data set
    var last_year = moment().format('YYYY');
    var last_month = moment().format('MM');
    var previousPoints = [];
    var year1 = last_year;
    var min_val = 0;
    if (data.length > 1) {
      year1 = data[0].year;
      min_val = 0.01;
    }
    for(var y=Number(last_year); y < year1; y++) {
      for(var m=Number(last_month); m <= 12; m++) {
        previousPoints.push({
          _id: Number(m),
          events: 0,
          year:y
        });
      }
      last_month = 1;
    }
    data = previousPoints.concat(data);

    // Fill the holes in data set
    var  i =0;
    var year = 0;
    var month = 0;
    var fullData = [];
    data.forEach(function(doc){
      if (year === 0 && month === 0) {
        year = Number(doc.year);
        month = Number(doc._id);
        fullData.push(doc);
      } else {
        y = Number(doc.year);
        m = Number(doc._id);
        if (y == year && m == month+1) {
          year = y;
          month = m;
        } else if(y == year) {
          for(i=month+1; i < m;i++){
            fullData.push({
              _id: i,
              events: min_val,
              year: year
            });
          }
        } else {
          for(i=month+1; i <= 12; i++) {
            fullData.push({
              _id: i,
              events: min_val,
              year:year
            });
          }
        }
        fullData.push(doc);
      }
    });

    // Fill the future after the query set
    last_year = moment().format('YYYY');
    last_month = moment().format('MM');
    fullData.forEach(function(doc){
      last_year = doc.year;
      last_month = doc._id;
      doc.month = doc._id;
      if (doc._id < 10) {
        doc.month = "0" + doc.month;
      }
    });
    var a = [];
    var diff = (12-fullData.length);
    for (i=diff; i--;) {
      a.push(diff-i);
    }
    a.forEach(function(i){
      last_month++;
      if (last_month > 12) {
        last_year++;
        last_month = 1;
      }
      var m = String(last_month);
      if (last_month < 10) {
        m = "0" + last_month;
      }
      fullData.push({
        _id: last_month,
        events: min_val,
        year: last_year,
        month: m
      });
    });

    res.render('aggregation', { results: fullData });
  };

  Deadline.aggregate(
    {
      $project: {
        _id: 0,
        title: 1,
        expires: 1,
        wallId: 1,
        date: {
          year: { $year: "$expires" },
          month: { $month: "$expires" }
        }
      }
    },
    { $match: { expires:{ $gt:now }, wallId:mongoose.Types.ObjectId(wall_id) } },
    { $group:  {
      _id: "$date.month",
      events: { $sum: 1 },
      year: { $first: "$date.year" }
    }},
    { $sort: { year:1, _id:1 } },
  handler);
};

