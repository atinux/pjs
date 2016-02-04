# Asynchronous

PJS templates has a way of handling the asynchronous code. A `done()` method let you control the flow of your async operations.

Let's say that I have an async operation to do before showing my content. If I do this:
```js
<%
var foo = 'bar';
setTimeout(function () {
  foo = 'PJS';
}, 100);
%>
Hello <%= foo %>!
```