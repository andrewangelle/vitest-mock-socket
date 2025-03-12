import type * as MockSocket from 'mock-socket';

export type MessageMatcherOptions = Partial<{
  timeout: number;
  partial: boolean;
}>;

export interface WebSocketServerOptions extends MockSocket.ServerOptions {}

export type DeserializedMessage<MessageType = object> = string | MessageType;
