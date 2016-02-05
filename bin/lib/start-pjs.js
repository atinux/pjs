var fs = require('fs'),
    path = require('path'),
    recluster = require('recluster'),
    _ = require('lodash');

var cluster = recluster(path.resolve(__dirname, '../../lib/server.js'), { timeout: 3, backoff: 0 }); // workers: 10
var reloading = false;
var terminating = false;
var pings = {};
var interval;

// Create .pjs folder
try { fs.mkdirSync(path.resolve(process.cwd(), '.pjs')); } catch(e) { if ( e.code != 'EEXIST' ) throw e; }

// TODO: use winston for logging in path.resolve(process.cwd(), '.pjs/app.log')

function reloadCluster() {
  if (reloading) return;
  reloading = true;
  cluster.reload(function () {
    reloading = false;
    pings = {};
    listenWorkers();
  });
};
function terminateCluster() {
  if (terminating) return;
  terminating = true;
  console.log('Terminating cluster...');
  setTimeout(function () {
    clearInterval(interval);
    // cluster.terminate(function () {
      // console.log('Cluster terminated.');
      process.exit();
    // });
  }, 1000);
};
function listenWorkers() {
  console.log('Nb workers:', cluster.workers().length, 'Active:', cluster.activeWorkers().length);
  cluster.workers().forEach(function (worker) {
    if (worker._rc_isReplaced) return;
    // console.log('Worker:', worker._rc_wid, 'Listening:', worker._listening);
    if (worker._listening) return;
    worker.on('message', function (msg) {
      // console.log('New message from worker ['+worker._rc_wid+']');
      // console.log(msg);
      if (msg && msg.cluster_cmd && msg.cluster_cmd === 'reload')
        return reloadCluster();
      if (msg && msg.cluster_cmd && msg.cluster_cmd === 'terminate')
        return terminateCluster();
      if (msg && msg.ping) {
        pings[worker._rc_wid] = Date.now();
      }
    });
    worker.process.on('exit', function () {
      // console.log('Woker ['+worker._rc_wid+'] exited.');
      pings[worker._rc_wid] = 'reload';
    });
    worker._listening = true;
  });
};
function findWorker(worderId) {
  var _worker = null;
  cluster.workers().forEach(function (worker) {
    if (String(worker._rc_wid) === String(worderId))
      _worker = worker;
  });
  return _worker;
};
function checkTimeoutWorker() {
  // console.log(pings, cluster.workers().length, cluster.activeWorkers().length);
  if (_.values(pings).indexOf('reload') !== -1)
    return listenWorkers();
  for (var workerId in pings) {
    if ((pings[workerId] + 10000) <= Date.now()) {
      var worker = findWorker(workerId);
      if (worker) {
        console.log('Worker ['+workerId+'] timeout! PID:', worker.process.pid);
        worker.process.kill();
      }
    }
  }
};

cluster.run();
listenWorkers();
interval = setInterval(checkTimeoutWorker, 2000);
