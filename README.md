![pjs logo](https://cloud.githubusercontent.com/assets/904724/12781194/25ffcc5c-ca73-11e5-8f34-7e8c7c7f6b09.png)

[![npm version](https://badge.fury.io/js/pjs-cli.svg)](https://badge.fury.io/js/pjs-cli)

## Installation

`npm install -g pjs-cli`

## Usage

`pjs <folder>`

By default, the folder is ./ and the port is 8080 (or process.env.PORT if defined).

Inside the folder where pjs is listening you can prototype any node.js applications thanks to the `.pjs` files (see examples).

## Examples

To launch the examples on your computer, install first pjs-cli and then :

```bash
git clone https://github.com/Atinux/pjs.git
cd pjs/
pjs examples/
```

You can visit `http://localhost:8080` too run all the examples presented below.

## What are these .pjs files ?

It's 90% of EJS templates with a `done()` method for making every asynchronous operations possible! (take a look at the examples #2)

## Example 1 - Basis

Let's say that I have a file name `hello.pjs` in my current folder:
```html
<% var foo = 'bar'; %>
Hello <%= foo %>!
```

I launch the cli in my current folder: `pjs`

Then, I visit : `http://localhost:8080/hello.pjs`

Result: Hello bar!

## Example 2 - Asynchronous

What about if we want something a little bit more asynchronous?

File `async.pjs`:
```html
<%
var request = require('request'),
    name;
request.get('http://www.mocky.io/v2/56af5cec1100004516f9bc90', function (err, res, body) {
  // body = { "name": "PJS" }
  name = JSON.parse(body).name;
  done();
});
%>
Hello <%= name %>!
```

As you can see, I can require a module, for that, please make sure to run `npm install request` in the current directory before visiting `http://localhost:8080/async.pjs`

The result will be : Hello PJS!

Notice the `done();` method, it is important here for PJS to wait until the request is completed and the `name` set before going further in the template.

## Example 3 - Includes

You may also want to include other .pjs files, that's why you can use the `<% include your_file.pjs %>` directly in your templates.

File `include.pjs`:
```html
<p>I'm including hello.pjs</p>
<%- include hello.pjs %>
```

Result on `http://localhost:8080/include.pjs`
<pre>
I'm including hello.pjs
Hello bar!
</pre>

**Actually, only this pre-processor include works. <%- include(file, { ... }); %> is not available yet.**

## Example 4 - REQUEST

Inside each .pjs file, you have access of the `REQUEST` variable. It contains some of the properties listed from Express (http://expressjs.com/en/4x/api.html#req);

File: `request.pjs`
```html
<% if (REQUEST.method === 'POST') { %>
  <p><b>New todo:</b> <%= REQUEST.body.todo %></p>
<% } %>
<form method="post">
  <input type="text" name="todo" placeholder="Learn Piano..." />
  <button type="submit">Add todo</button>
</form>
```

If you fill the input and click on "Add todo", the condition will pass and "New todo:" will be displayed on the screen with the content of the input.

List of the properties available in REQUEST:
<pre>
- baseUrl
- body
- headers
- hostname
- fresh
- ip
- ips
- method
- originalUrl
- path
- protocol
- query
- secure
- stale
- subdomains
- url
- xhr
</pre>

### Aliases

- `REQ` is equal to `REQUEST`.
- `FORM` which is `REQ.body` merge into `REQ.query`
- `METHOD` is equal to `REQUEST.method`

## Example 5 - RESPONSE

Sometimes you want to send back a custom status code or even a custom header. You can use the `RESPONSE` (alias: `RES`) object for this, here the current method available:
<pre>
- .status(code) // Set the HTTP status for the response
- .header(field [, value]) // Same as res.set() for Express
- .type(type) // Same as res.type() for Express
</pre>

File `response.pjs`:
```html
<%
RESPONSE.header('Custom', 'Hi!');
RESPONSE.status(404);
RESPONSE.type('text');
%>
I'm a page with a custom status code and header!
```

If you go on `http://localhost:8080/response.pjs` with POSTMAN, you will see the status code 404 with the custom header and the Content-Type set to plain/text.

## Example 6 - SESSION

In your PJS templates, you have also access to `SESSION`. This is useful for creating small apps for prototyping.

Here a Todo app with the use of the sessions with PJS.

File `session.pjs`:
```html
<%
SESSION.todos = SESSION.todos || [];
if (REQUEST.method === 'POST' && REQUEST.body.todo) {
  SESSION.todos.push(REQUEST.body.todo);
}
if (REQUEST.method === 'GET' && REQUEST.query.index) {
  SESSION.todos = SESSION.todos.filter(function (todo, index) {
    return index !== Number(REQUEST.query.index);
  });
}
%>
<form method="post">
  <input type="text" name="todo" placeholder="Learn Piano..." />
  <button type="submit">Add todo</button>
</form>
<ul>
  <% SESSION.todos.forEach(function (todo, index) { %>
    <li><%= todo %> - <a href="?index=<%- index %>">x</a></li>
  <% }); %>
</ul>
```

Go to `http://localhost:8080/session.pjs` to se it working.

`SESSION` is equivalent of `req.session` in Express.
PJS use [session-file-store](https://github.com/valery-barysok/session-file-store) to persist the sessions in files, so you can restart `pjs` without worrying about the sessions.

## Example 7 - JSON

For sending back a JSON object, simply display it with <%- yourJSON %>.

File `json.pjs`:
```html
<%- FORM %>
```

`FORM` is an alias of `REQ.body` merged into `REQ.query`.

Try to visit `http://localhost:8080/json?foo=bar&why=not`

*As you can see in the url, the `.jps` is optional.*

## Example 8 - Files

PJS let you upload files via [multer](https://github.com/expressjs/multer). The maximum number of files is 10 and each file size 5 MB. The files are stored in the /tmp folder and are automatically deleted when the page is rendered.

You can access the files via `REQUEST.files`. Important, the form as to be multipart (`multipart/form-data`).

File `files.pjs`:
```html
<% if (METHOD === 'POST' && REQ.files) { %>
<pre><%- JSON.stringify(REQ.files, undefined, 2) %></pre>
<% } %>
<form method="post" enctype="multipart/form-data">
  <p>File: <input type="file" name="file" /></p>
  <button type="submit">Upload</button>
</form>
```

You can go on `http://localhost:8080/files.pjs`, choose a file and click Upload, you will see all the data inside `REQUEST.files`.

Example:
```json
[
  {
    "fieldname": "file",
    "originalname": "pjs-image.jpg",
    "encoding": "7bit",
    "mimetype": "image/jpeg",
    "destination": "/tmp",
    "filename": "b52fb2303738fa17c0a2c8593de76798",
    "path": "/tmp/b52fb2303738fa17c0a2c8593de76798",
    "size": 71448
  }
]
```

## About PJS

As said before, PJS is mostly for quick prototyping and has no use case for production.

The idea was born after reading this article by VJEUX: http://blog.vjeux.com/2015/javascript/challenge-best-javascript-setup-for-quick-prototyping.html

## Todo
- Using daemonize for `pjs start` and `pjs stop`
- Using `pjs` only for strating (port and folder is in config file, default to ./), port can be confiured via process.env.PORT
- Stock sessions/ for file-session in .sessions/ + 403 urls when trying to access
- Config Winston log system
- Add tests (start server on test/pjs/ + call request and check source code)
- Central UI (only links to the modules): url/_ + Add basic auth on _ and _/*
- UI for configuring PJS (url/_/config): Authentification, Server (default port, proxy, SSL, folder for public views), Upload (nbFiles, fileSize, folder), Sessions (Secret key, Store (Mongo/Redis/Memory/Files + config), Sockets (enable/disable + socket config file), Errors Handler (Winstog log files, Sentry config, etc.)
- UI for configuring the Routes (url/_/routes): Router /api/users/:id -> render file api/users.pjs + add req.params inside REQ + FORM
- UI for configuring the Node modules (url/_/npm): Listing installed modules, Install/Update/Remove (http://npmsearch.com/query?q=pjs&fields=name,version,repository,description,author)
- UI for viewing/searching the logs (url/_/logs)
- Video of presentation
- Finding a way of using the sockets and configuring them server-side (path of the file to use) + try/catch to avoid server error on startup
