var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var deadlineSchema = new Schema({
  wallId: { type: Schema.Types.ObjectId, index: true },
  title: String,
  url: String,
  expires: Date,
  location: String,
  tags: Schema.Types.Mixed
});

var wallSchema = new Schema({
    email: String,
    description: String
});

exports.Deadline = mongoose.model('Deadline', deadlineSchema);
exports.Wall = mongoose.model('Wall', wallSchema);
