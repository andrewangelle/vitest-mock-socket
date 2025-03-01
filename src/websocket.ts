import type { Client, CloseOptions } from 'mock-socket';
import { Server } from 'mock-socket';

import type { DeserializedMessage, WebSocketServerOptions } from './types';

export class WebSocketServer {
  static clients: WebSocketServer[] = [];

  static clean() {
    for (const client of WebSocketServer.clients) {
      client.close();
      client.messages = [];
    }
    WebSocketServer.clients = [];
  }

  server: Server;
  messages: DeserializedMessage[] = [];
  #options: WebSocketServerOptions;
  #isConnected = Promise.withResolvers<Client>();
  #isClosed = Promise.withResolvers<Client>();
  #messageAdded = Promise.withResolvers<void>();
  #messageQueue: DeserializedMessage[] = [];

  constructor(url: string, options: WebSocketServerOptions = {}) {
    WebSocketServer.clients.push(this);
    this.#options = options;
    this.server = this.#createServer(url);
  }

  async connected() {
    return this.#isConnected.promise;
  }

  async closed() {
    return this.#isClosed.promise;
  }

  async nextMessage() {
    // if we have a queued message return it immediately
    if (this.#messageQueue.length > 0) {
      return this.#messageQueue.shift();
    }

    // otherwise wait until we have one
    await this.#messageAdded.promise;
    return this.#messageQueue.shift();
  }

  on(
    eventName: 'connection' | 'message' | 'close',
    callback: (socket: Client) => void,
  ): void {
    this.server.on(eventName, callback);
  }

  send(message: DeserializedMessage) {
    this.server.emit('message', this.#serialize(message));
  }

  close(options?: CloseOptions) {
    this.server.close(options);
  }

  error(options?: CloseOptions) {
    this.server.emit('error', null);
    this.server.close(options);
  }

  #isValidJSON(value: string) {
    return /^(?:\{.*\}|\[.*\])$/.test(value);
  }

  #serialize(deserializedMessage: DeserializedMessage) {
    const stringified = JSON.stringify(deserializedMessage);

    if (this.#isValidJSON(stringified)) {
      return stringified;
    }

    return deserializedMessage;
  }

  #deserialize(serializedMessage: string): DeserializedMessage {
    if (this.#isValidJSON(serializedMessage)) {
      try {
        const safeParsed = JSON.parse(serializedMessage);
        return safeParsed;
      } catch {
        // silently swallow JSON parse error
      }
    }
    return serializedMessage;
  }

  #createServer(url: string) {
    const server = new Server(url, this.#options);

    server.on('close', this.#isClosed.resolve);

    server.on('connection', (socket: Client) => {
      this.#isConnected.resolve(socket);

      socket.on('message', (message) => {
        const parsedMessage = this.#deserialize(message as string);
        this.messages.push(parsedMessage);
        this.#messageQueue.push(parsedMessage);
        this.#messageAdded.resolve();
        this.#messageAdded = Promise.withResolvers();
      });
    });

    return server;
  }
}
