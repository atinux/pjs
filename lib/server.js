var PATH = './';
var PORT = process.env.PORT || 8080;

var _PRODUCTION_ = process.env.NODE_ENV === 'production';
/* Start server */
var express = require('express');
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var methodOverride = require('method-override');
var multer  = require('multer');
var path = require('path');
var fs = require('fs');
var url = require('url');
var app = express();
global.noop = function () {};

// TODO: use winston for logging in path.resolve(process.cwd(), '.pjs/app.log')

// Forbidden PJS folder for log and config
app.use(function (req, res, next) {
  if (req.url === '/.pjs' || req.url.indexOf('/.pjs/') === 0)
    return res.status(403).end('Forbidden');
  next();
});

app.use(methodOverride('_method'));
app.use(methodOverride('X-HTTP-Method-Override'));

app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json

app.use(session({
  name: 'pjs.sid',
  store: new FileStore({
    path: path.resolve(process.cwd(), '.pjs/sessions'),
    logFn: noop,
  }),
  resave: false,
  saveUninitialized: false,
  secret: '1H6EU@k5-Jc"gYL1DF8B3n0=G+Sm[J'
}));

app.engine('pjs', function (filePath, locals, callback) {
  require('./pjs-engine')
  .renderFile(
    filePath,
    locals,
    { debug: false },
    function (err, res) {
      locals.__files.forEach(function (path) { fs.unlink(path, noop); });
      if (err) {
        locals.RESPONSE.status(500);
        if (_PRODUCTION_) {
          logError(err);
          res = 'Error on executing the file, please check your log files or disable the production mode.';
        } else {
          res = (err.stack || err.toString()).replace(/\n/g, '<br>').replace(/  /g, ' &nbsp;');
        }
      }
      callback(null, res);
    }
  );
});
app.set('view engine', 'pjs');
app.set('views', PATH);

var upload = multer({
  dest: '/tmp',
  limits: {
    fileSize: 1024 * 1024 *  5, // 5 MB
    files: 10,
  }
});

app.use(upload.any());
app.use(function (req, res, next) {
  // Check if .pjs extension
  var pathName = path.join(PATH, url.parse(req.url).pathname),
      lstat,
      render = false;

  try { lstat = fs.lstatSync(pathName) } catch (e) { lstat = null; }
  if (!lstat) {
    if (pathName.indexOf('.') === -1) {
      pathName = pathName + '.pjs';
      try { lstat = fs.lstatSync(pathName) } catch (e) { lstat = null; }
      if (lstat && lstat.isFile()) {
        render = true;
      }
    }
  } else {
    if (lstat.isFile() && String(pathName.slice(-3)).toLowerCase() === 'pjs') {
      render = true;
    }
    if (lstat.isDirectory()) {
      pathName = path.join(pathName, 'index.pjs');
      try { lstat = fs.lstatSync(pathName) } catch (e) { lstat = null; }
      if (lstat && lstat.isFile()) {
        render = true;
      }
    }
  }
  if (!render)
    return next();
  // console.log('Render PJS file: '+pathName);
  var locals = {
    REQUEST: {
      baseUrl: req.baseUrl,
      body: req.body || {},
      headers: req.headers,
      hostname: req.hostname,
      files: req.files || [],
      fresh: req.fresh,
      ip: req.ip,
      ips: req.ips || [],
      method: req.method,
      originalUrl: req.originalUrl,
      path: req.path,
      protocol: req.protocol,
      query: req.query || {},
      secure: req.secure,
      stale: req.stale,
      subdomains: req.subdomains,
      url: req.url,
      xhr: req.xhr,
    },
    RESPONSE: {
      header: res.header.bind(res),
      status: res.status.bind(res),
      type: res.type.bind(res),
    },
    SESSION: req.session,
    require: require,
    done: noop,
    __files: (req.files || []).map(function (file) { return file.path; }),
  };
  locals.REQ = locals.REQUEST;
  locals.RES = locals.RESPONSE;
  locals.METHOD = req.method;
  locals.FORM = req.query || {};
  for (var key in req.body) { locals.FORM[key] = req.body[key]; }
  res.render(pathName, locals);
});

app.use(serveStatic(PATH, {
  index: ['index.html', 'index.htm']
}));
app.use(serveIndex(PATH, { icons: true }));

var pingInterval;
var server = app.listen(PORT, function (err) {
  console.log('PJS server is working on ' + PATH + ' and port ' + server.address().port);
  pingInterval = setInterval(function () {
    process.send({ ping: true });
  }, 1000);
});

app.get('/lol', function (req, res) {
  res.send('loool #10');
});


process.on('message', function(m) {
  if (m.cmd === 'disconnect') {
    clearInterval(pingInterval);
    server.close();
  }
});

global.logError = function (err, log) {
	if (!err)
		return;
	log = (typeof log === 'boolean' ? log : true);
	if (log)
		console.log(err.stack || err.toString());
	if (!_PRODUCTION_)
		return err;
	// sentry.captureError(new Error(err));
	return err;
};

process.on('uncaughtException', function (err) {
  console.log('uncaughtException!!!', err, process.env.PORT);
  if (err.errno === 'EADDRINUSE') {
    return process.send({ cluster_cmd: 'terminate' });
  }
	err.message += ' [Uncaught Exception]';
	logError(err);
});
