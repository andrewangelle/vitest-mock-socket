import type * as MockSocket from 'mock-socket';

export type ReceiveMessageOptions = {
  timeout?: number;
};

export type WebSocketServerOptions = MockSocket.ServerOptions & {
  jsonProtocol?: boolean;
};

export type DeserializedMessage<MessageType = object> = string | MessageType;
