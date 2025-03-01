import '../extend-expect';

import { WebSocketServer } from '../websocket';

let server: WebSocketServer;
let client: WebSocket;

const testURL = 'ws://localhost:1234';
beforeEach(async () => {
  server = new WebSocketServer(testURL);
  client = new WebSocket(testURL);
  await server.connected();
});

afterEach(() => {
  WebSocketServer.clean();
});

describe('.toReceiveMessage', () => {
  it('passes when the websocket server receives the expected message', async () => {
    client.send('hello there');
    await expect(server).toReceiveMessage('hello there');
  });

  it('passes when the websocket server receives the expected message with custom timeout', async () => {
    setTimeout(() => {
      client.send('hello there');
    }, 2000);

    await expect(server).toReceiveMessage('hello there', { timeout: 3000 });
  });

  it('passes when the websocket server receives the expected JSON message', async () => {
    client.send(`{"answer":42}`);
    await expect(server).toReceiveMessage({ answer: 42 });
  });

  it('passes with JSON protocol on, but message is not JSON', async () => {
    client.send('not json');
    await expect(server).toReceiveMessage('not json');
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    expect.hasAssertions();
    await expect(
      expect('boom').toReceiveMessage('hello there'),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('fails when the WS server does not receive the expected message', async () => {
    expect.hasAssertions();
    await expect(
      expect(server).toReceiveMessage('hello there'),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('fails when the WS server does not receive the expected message with custom timeout', async () => {
    expect.hasAssertions();
    await expect(
      expect(server).toReceiveMessage('hello there', { timeout: 3000 }),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('fails when the WS server receives a different message', async () => {
    expect.hasAssertions();
    client.send('hello there');
    await expect(
      expect(server).toReceiveMessage('HI!'),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('passes when expecting a JSON message but the server is not configured for JSON protocols', async () => {
    expect.hasAssertions();
    client.send(`{"answer":42}`);
    expect(server).toReceiveMessage({ answer: 42 });
  });
});

describe('.not.toReceiveMessage', () => {
  it("passes when the websocket server doesn't receive the expected message", async () => {
    client.send('hello there');
    await expect(server).not.toReceiveMessage("What's up?");
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    expect.hasAssertions();
    await expect(
      expect('boom').not.toReceiveMessage('hello there'),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it("fails when the WS server doesn't receive any messages", async () => {
    expect.hasAssertions();
    await expect(
      expect(server).not.toReceiveMessage('hello there'),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('fails when the WS server receives the un-expected message', async () => {
    expect.hasAssertions();
    client.send('hello there');
    await expect(
      expect(server).not.toReceiveMessage('hello there'),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});
