var colors = require('colors/safe');
var fs = require('fs');
var path = require('path');
var forever = require('forever');
var noop = function() {};

var SCRIPT_PATH = path.resolve(__dirname, 'start-pjs.js');

function getOptions() {
  // https://github.com/foreverjs/forever-monitor#options-available-when-using-forever-in-nodejs
  return {
    pidFile: path.resolve(process.cwd(), '.pjs/pid'), // Path to put pid information for the process(es) started
    logFile: path.resolve(process.cwd(), '.pjs/daemon.log'), // Path to log output from forever process (when daemonized)
    max: 10, // Sets the maximum number of times a given script should run
    watch: false, // Value indicating if we should watch files
  };
}

function getDaemonMeta(cb) {
  forever.list(false, function(err, list) {
    if (list) {
      for (var i = 0, meta; meta = list[i]; i++) {
        if (meta.file === SCRIPT_PATH) {
          cb(meta);
          return;
        }
      }
    }
    cb(null);
  });
}

exports.start = function () {
  getDaemonMeta(function(meta) {
    if (meta)
      return console.log(colors.red('PJS daemon already running'));
    var monitor = forever.startDaemon(SCRIPT_PATH, getOptions());
    console.log(colors.green('PJS daemon successfully started'));
  });
};

exports.stop = function () {
  getDaemonMeta(function (meta) {
    if (!meta)
      return console.log(colors.red('PJS daemon not running'));
    forever
    .stop(SCRIPT_PATH)
    .on('stop', function(scripts) {
      fs.unlink(scripts[0].pidFile, noop);
      console.log(colors.green('PJS daemon successfully stopped'));
    });
  });
};

exports.restart = function () {
  getDaemonMeta(function(meta) {
    if (!meta)
      return exports.start();
    forever
    .stop(SCRIPT_PATH)
    .on('stop', function(scripts) {
      fs.unlink(scripts[0].pidFile, noop);
      console.log(colors.green('PJS daemon successfully stopped'));
      setTimeout(function () {
        exports.start();
      }, 100);
    });
  });
};

exports.status = function () {
  getDaemonMeta(function(meta) {
    var log, match, nbRestarts;
    if (meta) {
      log = fs.readFileSync(meta.logFile, 'utf8');
      match = log.match(/restarting script for \d+ time/g);
      nbRestarts = match ? match.length : 0;
      console.log(colors.green('PJS daemon running since ' + new Date(meta.ctime)));
      if (nbRestarts)
        console.log(colors.yellow('WARNING: PJS daemon restarted ' + nbRestarts + (nbRestarts > 1 ? ' times' : ' time')));
    } else {
      console.log(colors.red('PJS daemon not running'));
    }
  });
};
