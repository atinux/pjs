# pjs
PJS = PHP Workflow with Node.js (or using a FTP for coding with node.js)

This module is aim for quick prototyping.

## Installation

`npm install -g pjs-cli`

## Usage

`pjs <folder> -p <port>`

By default, the folder is ./ and the port is 8080.

Then, in the folder, it's like your www/ folder with Apache, but instead of .php, it's .pjs.

## Examples

To launch the examples on your computer, install first pjs and then :

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

## Example 5 - SESSION

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

## About PJS

As said before, PJS is mostly for quick prototyping and has no use case for production.

The idea was born after reading this article by VJEUX: http://blog.vjeux.com/2015/javascript/challenge-best-javascript-setup-for-quick-prototyping.html
