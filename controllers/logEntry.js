const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const moment = require('moment');
const LogEntry = require('../models/LogEntry');
const lookups = require('../public/js/lookups.js');


/**
 * Return activityDefinitions object
 */
exports.getActivityDefinitions = (req, res) => {
  res.send(lookups.activityDefinitions);
};


/**
 * GET /log
 * Render logEntry log template
 */
exports.getLog = (req, res) => {
  res.render('log/index', {
    title: 'My Log'
  });
};


/**
 * REST API endpoint
 * GET all log entries. Can filter with query string, e.g.:
 *  /api/log?user=user@domain.com&from=2017-05-01&to=2017-06-01
 */
exports.getLogEntries = (req, res) => {
  let user = req.query.user;  // user's email address
  let from = req.query.from;
  let to = req.query.to;
  let filter = {};

  if (user !== undefined) {
    user = user.replace('%40', '@');  // '@' symbol gets escaped sometimes
    filter["user"] = user;
  }

  if (from !== undefined || to !== undefined) {
    filter["date"] = {};
    if (from !== undefined) {
      filter["date"]["$gte"] = from;
    }
    if (to !== undefined) {
      filter["date"]["$lte"] = to;
    }
  }

  console.log('filter: ' + JSON.stringify(filter));

  LogEntry.find(filter, function(err, activities) {
    res.send({ data: activities });
  });
};


/**
 * REST API endpoint
 * GET one log entry by ID
 */
exports.getLogEntry = (req, res) => {
  const id = req.params.id;

  LogEntry.findById(id, function(err, logEntry) {
    res.send({ data: logEntry });
  });
};


/**
 * REST API endpoint
 * Update log entry by ID
 * Should be behind isAuthenticatedOwner middleware
 */
exports.updateLogEntry = (req, res) => {
  const id = req.params.id;
  const updateData = req.body.logEntry;

  LogEntry.findByIdAndUpdate(id, updateData, function(err, logEntry) {
    res.send({ data: logEntry });
  });
};


/**
 * REST API endpoint
 * Create new log entry
 * Should be behind isAuthenticatedOwner middleware
 */
exports.createLogEntry = (req, res) => {
  const newEntry = req.body.logEntry;

  LogEntry.save(newEntry, function(err, logEntry) {
    res.send({ data: logEntry });
  });
};


/**
 * REST API endpoint
 * Delete log entry by id
 * Should be behind isAuthenticatedOwner middleware
 */
exports.deleteLogEntry = (req, res) => {
  const id = req.params.id;

  LogEntry.findById(id).remove(function(err) {
    res.status(200).send("Success: Deleted logEntry document ID: " + id);
  });
};


/**
 * Calculate points based on activity and duration
 */
exports.calculateActivityPoints = (logEntry) => {
  const activityDefinition = activityDefinitions[logEntry.activity];

  // Is it the right time unit?
  if (logEntry.duration.unit !== activityDefinition.duration.unit) {
    res.status(500).send('500 error: Invalid activity.duration.unit: ' + logEntry.duration.unit +
                         '. Expected: ' + activityDefinition.duration.unit);
  }

  const completedTimeChunks = Math.floor(logEntry.duration.value / activityDefinition.duration.value);
  const points = completedTimeChunks * activityDefinition.points;

  return points;
};
