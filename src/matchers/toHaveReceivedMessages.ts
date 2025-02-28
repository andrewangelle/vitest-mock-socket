import type { MatcherState } from '@vitest/expect';
import type { DeserializedMessage } from '../types';
import { WebSocketServer } from '../websocket';
import { createFmt, getInvalidServerResult } from './utils';

export function toHaveReceivedMessages(
  this: MatcherState,
  received: DeserializedMessage[],
  expected: DeserializedMessage[],
) {
  // Validate that a websocket server was passed to expect.
  // i.e. expect(server).toHaveResolved(...)
  if (!(received instanceof WebSocketServer)) {
    return getInvalidServerResult.call(
      this,
      'toHaveReceivedMessages',
      received,
    );
  }

  // handles comparison when option.jsonProtocol set to true
  const equalities = expected.map((expectedMsg) =>
    received.messages.some((receivedMsg) =>
      this.equals(receivedMsg, expectedMsg),
    ),
  );

  const pass = this.isNot
    ? equalities.some(Boolean)
    : equalities.every(Boolean);

  return {
    actual: received.messages,
    expected,
    pass,
    message: () => {
      const printCli = createFmt.call(this, 'toHaveReceivedMessages');

      if (this.isNot) {
        return printCli`
          Expected the WebSocketServer to not have received the following messages: 
            ${this.utils.printExpected(expected)}
          
          But it received: 
            ${this.utils.printReceived(received.messages)}
        `;
      }

      return printCli`
        Expected the WebSocketServer to have received the following messages: 
          ${this.utils.printExpected(expected)}

        Received: 
          ${this.utils.printReceived(received.messages)}
      `;
    },
  };
}
