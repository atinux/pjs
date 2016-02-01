module.exports = function (PATH, PORT) {
  if (!PATH)
    return console.log('Path has to be given');
  if (!PORT || Number(PORT).toString() !== String(PORT))
    PORT = 8080;

  /* Start server */
  var express = require('express');
  var serveIndex = require('serve-index');
  var serveStatic = require('serve-static');
  var bodyParser = require('body-parser');
  var session = require('express-session');
  var FileStore = require('session-file-store')(session);
  var path = require('path');
  var fs = require('fs');
  var url = require('url');
  var app = express();
  global.noop = function () {};

  app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
  app.use(bodyParser.json()); // parse application/json

  app.use(session({
    name: 'pjs.sid',
    store: new FileStore({

    }),
    resave: false,
    saveUninitialized: false,
    secret: '1H6EU@k5-Jc"gYL1DF8B3n0=G+Sm[J'
  }));

  app.engine('pjs', function (filePath, data, callback) {
    require('./pjs-engine')
    .renderFile(
      filePath,
      data,
      { debug: false },
      callback
    );
  });
  app.set('view engine', 'pjs');
  app.set('views', PATH);

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
    res.render(pathName, {
      REQUEST: {
        baseUrl: req.baseUrl,
        body: req.body || {},
        headers: req.headers,
        hostname: req.hostname,
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
      SESSION: req.session,
      require: require,
      done: noop,
    });
  });

  app.use(serveStatic(PATH, {
    index: ['index.html', 'index.htm']
  }));
  app.use(serveIndex(PATH, { icons: true }));

  console.log('Starting PJS server on ' + PATH + ' and port ' + PORT);
  app.listen(PORT);
};
