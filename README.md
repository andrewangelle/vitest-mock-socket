# vitest mock socket

A set of utilities and matchers to aid in mocking websocket servers in vitest.

Built on top of [mock-socket](https://github.com/thoov/mock-socket) and a refactored implementation of [vitest-websocket-mock](https://github.com/akiomik/vitest-websocket-mock) and [jest-websocket-mock](https://github.com/romgain/jest-websocket-mock)

[![npm version](https://badge.fury.io/js/vitest-mock-socket.svg)](https://badge.fury.io/js/vitest-mock-socket)<br />
[![Build Status](https://github.com/andrewangelle/vitest-mock-socket/actions/workflows/ci.yml/badge.svg)](https://github.com/andrewangelle/vitest-mock-socket/actions)

## Install

```bash
npm install -D vitest-mock-socket
``` 


## Usage

Import and instantiate the instance

```js
import { WebSocketServer } from 'vitest-mock-socket';

const server = new WebSocketServer(url);
```

Connect a client to the same url
```js
const client = new WebSocket(url);
```

Wait for the server to connect
```js
await server.connected(); 
```

The server will record all messages it receives
```js
client.send('hello');
```

The server can also send messages to all connected clients
```js
server.send('hello everyone');
```

The server will also handle json messages out of the box
```js
server.send({ foo: 'bar' })
```

Simulate an error and close the connection
```js
server.error();
```

Gracefully close the connection
```js
server.close();
```

The instance also has a static method to gracefully close all open connections. This is particularly useful to reset the environment between test runs.
```js
WebSocketServer.clean();
```

### `WebSocketServer` constructor

#### Methods
- `connected` 
  - a Promise that resolves every time the mock server receives a new connection. The resolved value is the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) client instance that initiated the connection.
- `closed`
  - a Promise that resolves every time a connection to the mock server is closed.
- `nextMessage`
  - a Promise that resolves every time a mock server instance receives a new message. 
- `send`
  - send a message to all connected clients.
- `close`
  - gracefully closes all opened connections.
- `error`
  - sends an error message to all connected clients and closes all opened connections.
- `on`
  - attach event listeners to handle new `connection`, `message` and `close` events. The callback receives the `socket` as its only argument.



#### Options
The constructor accepts an optional options object as second argument.

The options supported by the [mock-socket](https://github.com/thoov/mock-socket) library are directly passed-through to the mock-server's constructor.

```ts
export interface WebSocketServerOptions extends MockSocket.ServerOptions {}
```

```js
const server = new WebSocketServer(url, options);
```

##### verifyClient

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
        const client = new WebSocket(url);
        client.onerror = errorCallback;
        client.onopen = resolve;
      })
      // WebSocket onerror event gets called with an event of type error and not an error
    ).rejects.toEqual(expect.objectContaining({ type: 'error' }));
  });
  ```

##### selectProtocol

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


## Vitest matchers

Custom vitest matchers are included to ease running assertions on received messages:

#### .toReceiveMessage
An async matcher that waits for the next message received by the the mocked websocket server, and asserts its content. It will time out with a helpful message after 1000ms.

```js
test('the server keeps track of received messages, and yields them as they come in', async () => {
  const server = new WebSocketServer(url);
  const client = new WebSocket(url);

  await server.connected();

  client.send('hello');

  await expect(server).toReceiveMessage('hello');  
});
```

#### .toHaveReceivedMessages 
A synchronous matcher that checks that all the expected messages have been received by the mock websocket server.

**Note:** Since this matcher is synchronous, you must call `.nextMessage` for each message sent before asserting with this matcher. You can get the same behavior without the need to manually call `.nextMessage` by using the asynchronous variant `toHaveResolvedMessages`

```js
test('the server keeps track of received messages, and yields them as they come in', async () => {
  const server = new WebSocketServer(url);
  const client = new WebSocket(url);

  await server.connected();

  client.send('hello');
  client.send('goodbye');

  await server.nextMessage();
  await server.nextMessage();

  expect(server).toHaveReceivedMessages(['hello', 'goodbye']);
});
```

```js
test('server handles mixed message types', async () => {
  const server = new WebSocketServer(url);
  const client = new WebSocket(url);
  
  await server.connected();

  client.send('hello there');
  client.send(`{"type":"GREETING","payload":"how are you?"}`);
  client.send(`{"type":"GREETING","payload":"good?"}`);

  await server.nextMessage();
  await server.nextMessage();
  await server.nextMessage();

  expect(server).toHaveReceivedMessages([
    'hello there',
    { type: 'GREETING', payload: 'how are you?' },
    { type: 'GREETING', payload: 'good?' },
  ]);
});
```

#### .toHaveResolvedMessages 
A asynchronous version of `toHaveReceivedMessages`. It will automatically resolve the message queue so you do not have to manually call `server.nextMessage`.

Default behavior is to match exactly.
```js
test('the server keeps track of received messages, and yields them as they come in', async () => {
  const server = new WebSocketServer(url);
  const client = new WebSocket(url);

  await server.connected();

  client.send('hello');
  client.send('goodbye');

  await expect(server).toHaveResolvedMessages(['hello', 'goodbye']);
});
```

This would fail
```js
test('the server keeps track of received messages, and yields them as they come in.', async () => {
  const server = new WebSocketServer(url);
  const client = new WebSocket(url);

  await server.connected();

  client.send('hello');
  client.send('goodbye');

  await expect(server).toHaveResolvedMessages(['hello', 'how are you?', 'goodbye']);
});
```

Accepts an options object to allow for partial matches.
```js
test('the server keeps track of received messages, and yields them as they come in.', async () => {
  const server = new WebSocketServer(url);
  const client = new WebSocket(url);

  await server.connected();

  client.send('hello');
  client.send('goodbye');

  await expect(server).toHaveResolvedMessages(['hello'], { partial: true });
});
```

```js
  test('server handles mixed message types', async () => {
    const server = new WebSocketServer(url);
    const client = new WebSocket(url);
    await server.connected();
    client.send('hello there');
    client.send(`{"type":"GREETING","payload":"how are you?"}`);
    client.send(`{"type":"GREETING","payload":"good?"}`);
    await expect(server).toHaveResolvedMessages([
      'hello there',
      { type: 'GREETING', payload: 'how are you?' },
      { type: 'GREETING', payload: 'good?' },
    ]);
  });
```

## Other examples

#### Send messages to multiple connected clients

```js
test('the mock server sends messages to connected clients', async () => {
  const server = new WebSocketServer(url);

  const client1 = new WebSocket(url);
  await server.connected();
  
  const client2 = new WebSocket(url);
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


#### Sending errors

```js
test('the mock server sends errors to connected clients', async () => {
  const server = new WebSocketServer(url);
  const client = new WebSocket(url);
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

#### Refuse connections example:

```js
it('the server can refuse connections', async () => {
  const server = new WebSocketServer(url);
  server.on('connection', (socket) => {
    socket.close({ wasClean: false, code: 1003, reason: 'NOPE' });
  });

  const client = new WebSocket(url);
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
  server = new WebSocketServer(url);
  client = new WebSocket(url);
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
// example.test.js
import WebSocket from 'ws';
import { vi } from 'vitest';

vi.mock('ws');

// do some tests...
```

**NOTE** The [ws](https://github.com/websockets/ws) library is not 100% compatible with the browser API, and `vitest-mock-socket`'s dependency [mock-socket](https://github.com/thoov/mock-socket) only implements the browser API.

As a result, `vitest-mock-socket` will only work with the [ws](https://github.com/websockets/ws) library if you restrict yourself to the browser APIs.
