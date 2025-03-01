import '../extend-expect';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

describe('.toHaveReceivedMessages', () => {
  it('passes when the websocket server received the expected messages', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await server.nextMessage();
    await server.nextMessage();
    await server.nextMessage();
    expect(server).toHaveReceivedMessages(['hello there', 'good?']);
  });

  it('passes when the websocket server received the expected JSON messages', async () => {
    client.send(`{"type":"GREETING","payload":"hello there"}`);
    client.send(`{"type":"GREETING","payload":"how are you?"}`);
    client.send(`{"type":"GREETING","payload":"good?"}`);
    await server.nextMessage();
    await server.nextMessage();
    await server.nextMessage();
    expect(server).toHaveReceivedMessages([
      { type: 'GREETING', payload: 'good?' },
      { type: 'GREETING', payload: 'hello there' },
    ]);
  });

  it('passes when the websocket server received mixed message types', async () => {
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

  it('fails when the websocket server did not receive the expected messages', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await server.nextMessage();
    await server.nextMessage();
    await server.nextMessage();
    expect(() => {
      expect(server).toHaveReceivedMessages(['hello there', "'sup?"]);
    }).toThrowErrorMatchingSnapshot();
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    expect(() => {
      expect('boom').toHaveReceivedMessages(['hello there']);
    }).toThrowErrorMatchingSnapshot();
  });
});

describe('.not.toHaveReceivedMessages', () => {
  it('passes when the websocket server received none of the specified messages', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await server.nextMessage();
    await server.nextMessage();
    await server.nextMessage();
    expect(server).not.toHaveReceivedMessages(["'sup?", 'U good?']);
  });

  it('fails when the websocket server received at least one unexpected message', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await server.nextMessage();
    await server.nextMessage();
    await server.nextMessage();
    expect(() => {
      expect(server).not.toHaveReceivedMessages([
        "'sup?",
        'U good?',
        'hello there',
      ]);
    }).toThrowErrorMatchingSnapshot();
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    expect(() => {
      expect('boom').not.toHaveReceivedMessages(['hello there']);
    }).toThrowErrorMatchingSnapshot();
  });
});
