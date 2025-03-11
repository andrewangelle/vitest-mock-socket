import '../../extend-expect';

import { WebSocketServer } from '../../websocket';

let server: WebSocketServer;
let client: WebSocket;

const testURL = 'ws://localhost:1234';

beforeEach(async () => {
  server = new WebSocketServer(testURL);
  client = new WebSocket(testURL);

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
    const messages = [
      { type: 'GREETING', payload: 'hello there' },
      { type: 'GREETING', payload: 'how are you?' },
      { type: 'GREETING', payload: 'good?' },
    ];

    for (const message of messages) {
      client.send(JSON.stringify(message));
      await server.nextMessage();
    }

    await expect(server).toHaveResolvedMessages(messages);
  });

  it('passes when the websocket server receives mixed message types', async () => {
    type WSMessageInit = string | ArrayBufferLike | Blob | ArrayBufferView;

    const messages = [
      'hello there',
      { type: 'GREETING', payload: 'how are you?' },
      { type: 'GREETING', payload: 'good?' },
    ];

    client.send(messages[0] as WSMessageInit);
    client.send(JSON.stringify(messages[1]));
    client.send(JSON.stringify(messages[2]));

    for (const _message of messages) {
      await server.nextMessage();
    }

    await expect(server).toHaveResolvedMessages(messages);
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
