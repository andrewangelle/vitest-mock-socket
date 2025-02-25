import '../extend-expect';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { WebSocketServer } from '../websocket';

let server: WebSocketServer;
let client: WebSocket;
beforeEach(async () => {
  server = new WebSocketServer('ws://localhost:1234');
  client = new WebSocket('ws://localhost:1234');

  server.on('message', (msg) => {
    console.log(msg);
  });
  await server.connected();
});

afterEach(() => {
  WebSocketServer.clean();
});

describe('.toHaveResolvedMessages', () => {
  it('passes when the websocket server received the expected messages', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await expect(server).toHaveResolvedMessages([
      'hello there',
      'how are you?',
      'good?',
    ]);
  });

  it('passes when the websocket server received the expected JSON messages', async () => {
    const jsonServer = new WebSocketServer('ws://localhost:9876', {
      jsonProtocol: true,
    });
    const jsonClient = new WebSocket('ws://localhost:9876');
    await jsonServer.connected();
    jsonClient.send(`{"type":"GREETING","payload":"hello there"}`);
    jsonClient.send(`{"type":"GREETING","payload":"how are you?"}`);
    jsonClient.send(`{"type":"GREETING","payload":"good?"}`);
    await expect(jsonServer).toHaveResolvedMessages([
      { type: 'GREETING', payload: 'hello there' },
      { type: 'GREETING', payload: 'how are you?' },
      { type: 'GREETING', payload: 'good?' },
    ]);
  });

  it('passes when the websocket server receives mixed message types', async () => {
    const jsonServer = new WebSocketServer('ws://localhost:9876', {
      jsonProtocol: true,
    });
    const jsonClient = new WebSocket('ws://localhost:9876');
    await jsonServer.connected();
    jsonClient.send('hello there');
    jsonClient.send(`{"type":"GREETING","payload":"how are you?"}`);
    jsonClient.send(`{"type":"GREETING","payload":"good?"}`);
    await expect(jsonServer).toHaveResolvedMessages([
      'hello there',
      { type: 'GREETING', payload: 'how are you?' },
      { type: 'GREETING', payload: 'good?' },
    ]);
  });

  it('fails when the websocket server did not receive the expected messages', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await expect(
      expect(server).toHaveResolvedMessages(['hello there', "'sup?"]),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('allows partial matches', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await expect(server).toHaveResolvedMessages(['hello there'], {
      partial: true,
    });
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    await expect(
      expect('boom').toHaveResolvedMessages(['hello there']),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe('.not.toHaveResolvedMessages', () => {
  it('passes when the websocket server received none of the specified messages', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await expect(server).not.toHaveResolvedMessages(["'sup?", 'U good?']);
  });

  it('fails when the websocket server received at least one unexpected message', async () => {
    client.send('hello there');
    client.send('how are you?');
    client.send('good?');
    await expect(
      expect(server).not.toHaveResolvedMessages([
        "'sup?",
        'U good?',
        'hello there',
      ]),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    await expect(
      expect('boom').not.toHaveResolvedMessages(['hello there']),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});
