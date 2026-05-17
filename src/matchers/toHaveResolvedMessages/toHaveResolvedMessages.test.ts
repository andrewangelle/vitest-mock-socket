import { WebSocketServer } from '~/websocket';

let server: WebSocketServer;
let client: WebSocket;

const testURL = 'ws://localhost:1234';

const testMatcherOptions = {
  timeout: 20,
};

beforeEach(async () => {
  server = new WebSocketServer(testURL);
  client = new WebSocket(testURL);

  await server.connected();
});

afterEach(() => {
  WebSocketServer.clean();
});

describe('.toHaveResolvedMessages', () => {
  it('passes when the websocket server received the expected messages', async () => {
    const messages = ['hello there', 'how are you?', 'good?'];

    for (const message of messages) {
      client.send(message);
    }

    await expect(server).toHaveResolvedMessages(messages, testMatcherOptions);
  });

  it('passes when the websocket server received the expected JSON messages', async () => {
    const messages = [
      { type: 'GREETING', payload: 'hello there' },
      { type: 'GREETING', payload: 'how are you?' },
      { type: 'GREETING', payload: 'good?' },
    ];

    for (const message of messages) {
      client.send(JSON.stringify(message));
    }

    await expect(server).toHaveResolvedMessages(messages, testMatcherOptions);
  });

  it('passes when the websocket server receives mixed message types', async () => {
    const messages: [string, object, object] = [
      'hello there',
      { type: 'GREETING', payload: 'how are you?' },
      { type: 'GREETING', payload: 'good?' },
    ];

    for (const message of messages) {
      const msg =
        typeof message === 'string' ? message : JSON.stringify(message);
      client.send(msg);
    }

    await expect(server).toHaveResolvedMessages(messages, testMatcherOptions);
  });

  it('fails when the websocket server did not receive the expected messages', async () => {
    const messages = ['hello there', 'how are you?', 'good?'];

    for (const message of messages) {
      client.send(message);
    }

    await expect(
      expect(server).toHaveResolvedMessages(
        ['hello there', "'sup?"],
        testMatcherOptions,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('allows partial matches', async () => {
    const messages = ['hello there', 'how are you?', 'good?'];

    for (const message of messages) {
      client.send(message);
    }

    await expect(server).toHaveResolvedMessages([messages[0]], {
      ...testMatcherOptions,
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
    const messages = ['hello there', 'how are you?', 'good?'];

    for (const message of messages) {
      client.send(message);
    }

    await expect(server).not.toHaveResolvedMessages(
      ["'sup?", 'U good?'],
      testMatcherOptions,
    );
  });

  it('fails when the websocket server received at least one unexpected message', async () => {
    const messages = ['hello there', 'how are you?', 'good?'];

    for (const message of messages) {
      client.send(message);
    }

    await expect(
      expect(server).not.toHaveResolvedMessages(
        ["'sup?", 'U good?', 'hello there'],
        testMatcherOptions,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('fails when called with an expected argument that is not a valid WS', async () => {
    await expect(
      expect('boom').not.toHaveResolvedMessages(['hello there']),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});
