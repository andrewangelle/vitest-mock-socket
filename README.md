# Vitest mock socket

[![npm version](https://badge.fury.io/js/vitest-mock-socket.svg)](https://badge.fury.io/js/vitest-mock-socket)
[![Build Status](https://github.com/andrewangelle/vitest-mock-socket/actions/workflows/ci.yml/badge.svg)](https://github.com/andrewangelle/vitest-mock-socket/actions)

A set of utilities and Vitest matchers to help testing complex websocket interactions.

Built on top of [mock-socket](https://github.com/thoov/mock-socket) and a refactored implementation of [vitest-websocket-mock](https://github.com/akiomik/vitest-websocket-mock) and [jest-websocket-mock](https://github.com/romgain/jest-websocket-mock)


## Install

```bash
npm install -D vitest-mock-socket
``` 

## Mock a websocket server

### The `WebSocketServer` constructor

`vitest-mock-socket` exposes a `WebSocketServer` class that can instantiate mock websocket
servers that keep track of the messages they receive, and in turn
can send messages to connected clients.

```js
import { WebSocketServer } from 'vitest-mock-socket';

// create a WebSocketServer instance, listening on port 1234 on localhost
const server = new WebSocketServer('ws://localhost:1234');

// real clients can connect
const client = new WebSocket('ws://localhost:1234');
await server.connected(); // wait for the server to have established the connection

// the mock websocket server will record all the messages it receives
client.send('hello');

// the mock websocket server can also send messages to all connected clients
server.send('hello everyone');

// ...simulate an error and close the connection
server.error();

// ...or gracefully close the connection
server.close();

// The WebSocketServer class also has a static "clean" method to gracefully close all open connections,
// particularly useful to reset the environment between test runs.
WebSocketServer.clean();
```

The `WebSocketServer` constructor also accepts an optional options object as second argument:

- `jsonProtocol: true` can be used to automatically serialize and deserialize JSON messages:

```js
const server = new WebSocketServer(
  'ws://localhost:1234', 
  { jsonProtocol: true }
);

server.send({ type: 'GREETING', payload: 'hello' });
```

- The [mock-socket](https://github.com/thoov/mock-socket)'s options `verifyClient` and `selectProtocol` are directly passed-through to the mock-server's constructor.

### Attributes of a `WebSocketServer` instance

A `WebSocketServer` instance has the following attributes:

- `connected`: a Promise that resolves every time the `WebSocketServer` instance receives a
  new connection. The resolved value is the `WebSocket` instance that initiated
  the connection.
- `closed`: a Promise that resolves every time a connection to a `WebSocketServer` instance
  is closed.
- `nextMessage`: a Promise that resolves every time a `WebSocketServer` instance receives a
  new message. The resolved value is either a string or deserialized json based on the options passed to the constructor.

### Methods on a `WebSocketServer` instance

- `send`: send a message to all connected clients.
- `close`: gracefully closes all opened connections.
- `error`: sends an error message to all connected clients and closes all
  opened connections.
- `on`: attach event listeners to handle new `connection`, `message` and `close` events. The callback receives the `socket` as its only argument.

## Custom vitest matchers

`vitest-mock-socket` registers custom vitest matchers to ease running assertions on received messages:

### .toReceiveMessage
An async matcher that waits for the next message received by the the mocked websocket server, and asserts its content. It will time out with a helpful message after 1000ms.

```js
test('the server keeps track of received messages, and yields them as they come in', async () => {
  const server = new WebSocketServer('ws://localhost:1234');
  const client = new WebSocket('ws://localhost:1234');

  await server.connected();

  client.send('hello');

  await expect(server).toReceiveMessage('hello');  
});
```

### .toHaveReceivedMessages 
A synchronous matcher that checks that all the expected messages have been received by the mock websocket server.


```js
test('the server keeps track of received messages, and yields them as they come in', async () => {
  const server = new WebSocketServer('ws://localhost:1234');
  const client = new WebSocket('ws://localhost:1234');

  await server.connected();

  client.send('hello');
  client.send('goodbye');

  
  expect(server).toHaveReceivedMessages(['hello', 'goodbye']);
});
```

```js
test('the server keeps track of received messages, and yields them as they come in', async () => {
  const server = new WebSocketServer('ws://localhost:1234');
  const client = new WebSocket('ws://localhost:1234');

  await server.connected();
  client.send('hello');
  await expect(server).toReceiveMessage('hello');
  expect(server).toHaveReceivedMessages(['hello']);
});
```

### Send messages to multiple connected clients

```js
test('the mock server sends messages to connected clients', async () => {
  const server = new WebSocketServer('ws://localhost:1234');

  const client1 = new WebSocket('ws://localhost:1234');
  await server.connected();
  
  const client2 = new WebSocket('ws://localhost:1234');
  await server.connected();

  const messages = { client1: [], client2: [] };
  client1.onmessage = (e) => {
    messages.client1.push(e.data);
  };
  client2.onmessage = (e) => {
    messages.client2.push(e.data);
  };

  server.send('hello everyone');
  expect(messages).toEqual({
    client1: ['hello everyone'],
    client2: ['hello everyone'],
  });
});
```

### JSON protocols support

`vitest-mock-socket` automatically serializes and deserializes
JSON messages:

```js
test('the mock server seamlessly handles JSON protocols', async () => {
  const server = new WebSocketServer('ws://localhost:1234', { jsonProtocol: true });
  const client = new WebSocket('ws://localhost:1234');

  await server.connected();
  client.send(`{ "type": "GREETING", "payload": "hello" }`);
  await expect(server).toReceiveMessage({ type: 'GREETING', payload: 'hello' });
  expect(server).toHaveReceivedMessages([{ type: 'GREETING', payload: 'hello' }]);

  let message = null;
  client.onmessage = (e) => {
    message = e.data;
  };

  server.send({ type: 'CHITCHAT', payload: 'Nice weather today' });
  expect(message).toEqual(`{"type":"CHITCHAT","payload":"Nice weather today"}`);
});
```

### verifyClient server option

A `verifyClient` function can be given in the options for the `vitest-mock-socket` constructor.

This can be used to test behavior for a client that connects to a WebSocket server that it is blacklisted from. For example:

**Note** : _Currently [mock-socket](https://github.com/thoov/mock-socket)'s implementation does not send any parameters to this function (unlike the real `ws` implementation)._

```js
test('rejects connections that fail the verifyClient option', async () => {
  new WebSocketServer('ws://localhost:1234', { verifyClient: () => false });
  const errorCallback = vitest.fn();

  await expect(
    new Promise((resolve, reject) => {
      errorCallback.mockImplementation(reject);
      const client = new WebSocket('ws://localhost:1234');
      client.onerror = errorCallback;
      client.onopen = resolve;
    })
    // WebSocket onerror event gets called with an event of type error and not an error
  ).rejects.toEqual(expect.objectContaining({ type: 'error' }));
});
```

### selectProtocol server option

A `selectProtocol` function can be given in the options for the `vitest-mock-socket` constructor.
This can be used to test behaviour for a client that connects to a WebSocket server using the wrong protocol.

```js
test('rejects connections that fail the selectProtocol option', async () => {
  const selectProtocol = () => null;
  new WebSocketServer('ws://localhost:1234', { selectProtocol });
  const errorCallback = vitest.fn();

  await expect(
    new Promise((resolve, reject) => {
      errorCallback.mockImplementationOnce(reject);
      const client = new WebSocket('ws://localhost:1234', 'foo');
      client.onerror = errorCallback;
      client.onopen = resolve;
    })
  ).rejects.toEqual(
    // WebSocket onerror event gets called with an event of type error and not an error
    expect.objectContaining({
      type: 'error',
      currentTarget: expect.objectContaining({ protocol: 'foo' }),
    })
  );
});
```

### Sending errors

```js
test('the mock server sends errors to connected clients', async () => {
  const server = new WebSocketServer('ws://localhost:1234');
  const client = new WebSocket('ws://localhost:1234');
  await server.connected();

  let disconnected = false;
  let error = null;
  client.onclose = () => {
    disconnected = true;
  };
  client.onerror = (e) => {
    error = e;
  };

  server.send('hello everyone');
  server.error();
  expect(disconnected).toBe(true);
  expect(error.origin).toBe('ws://localhost:1234/');
  expect(error.type).toBe('error');
});
```

### Add custom event listeners

#### Refuse connections example:

```js
it('the server can refuse connections', async () => {
  const server = new WebSocketServer('ws://localhost:1234');
  server.on('connection', (socket) => {
    socket.close({ wasClean: false, code: 1003, reason: 'NOPE' });
  });

  const client = new WebSocket('ws://localhost:1234');
  client.onclose = (event: CloseEvent) => {
    expect(event.code).toBe(1003);
    expect(event.wasClean).toBe(false);
    expect(event.reason).toBe('NOPE');
  };

  expect(client.readyState).toBe(WebSocket.CONNECTING);

  await server.connected();
  expect(client.readyState).toBe(WebSocket.CLOSING);

  await server.closed();
  expect(client.readyState).toBe(WebSocket.CLOSED);
});
```

### Environment set up and tear down between tests

You can set up a mock server and a client, and reset them between tests:

```js
beforeEach(async () => {
  server = new WebSocketServer('ws://localhost:1234');
  client = new WebSocket('ws://localhost:1234');
  await server.connected();
});

afterEach(() => {
  WebSocketServer.clean();
});
```

## Known issues

`mock-socket` has a strong usage of delays (`setTimeout` to be more specific). This means using `vi.useFakeTimers();` will cause issues such as the client appearing to never connect to the server.

While running the websocket server from tests within the vitest-dom environment (as opposed to node)
you may see errors of the nature:

```bash
 ReferenceError: setImmediate is not defined
```

You can work around this by installing the setImmediate shim from
[https://github.com/YuzuJS/setImmediate](https://github.com/YuzuJS/setImmediate) and
adding `require('setimmediate');` to your `setupTests.js`.

## Using `vitest-mock-socket` to interact with a non-global WebSocket object

`vitest-mock-socket` uses the [mock-socket](https://github.com/thoov/mock-socket) library.
under the hood to mock out WebSocket clients.

Out of the box, [mock-socket](https://github.com/thoov/mock-socket) will only mock out the global `WebSocket` object. If you are using a third-party WebSocket client library (eg. a Node.js
implementation, like [ws](https://github.com/websockets/ws)), you'll need to set up a [manual mock](https://vitest.dev/api/vi.html#vi-mock):

- Create a `__mocks__` folder in your project root
- Add a new file in the `__mocks__` folder named after the library you want to
  mock out. For instance, for the `ws` library: `__mocks__/ws.js`.
- Export Mock Socket's implementation in-lieu of the normal export from the
  library you want to mock out. For instance, for the `ws` library:

```js
// __mocks__/ws.js

export { WebSocket as default } from 'mock-socket';
```

- Somewhere in the test files, call `vi.mock` with the name of the library you want to mock. For instance, for the [ws](https://github.com/websockets/ws) library:

```js
// foo.test.js

import WebSocket from 'ws';
import { vi } from 'vitest';

vi.mock('ws');

// do some tests...
```

**NOTE** The [ws](https://github.com/websockets/ws) library is not 100% compatible with the browser API, and `vitest-mock-socket`'s dependency [mock-socket](https://github.com/thoov/mock-socket) only implements the browser API.

As a result, `vitest-mock-socket` will only work with the [ws](https://github.com/websockets/ws) library if you restrict yourself to the browser APIs.
