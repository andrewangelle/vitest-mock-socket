import type { MatcherState } from '@vitest/expect';
import type { DeserializedMessage, MessageMatcherOptions } from '../types';
import { WebSocketServer } from '../websocket';
import {
  createFmt,
  getInvalidServerResult,
  resolveAllClientMessages,
} from './utils';

export async function toHaveResolvedMessages(
  this: MatcherState,
  received: DeserializedMessage[],
  expected: DeserializedMessage[],
  options?: MessageMatcherOptions,
) {
  // Validate that a websocket server was passed to expect.
  // i.e. expect(server).toHaveResolved(...)
  if (!(received instanceof WebSocketServer)) {
    return getInvalidServerResult.call(
      this,
      'toHaveResolvedMessages',
      received,
    );
  }

  await resolveAllClientMessages(received, options);

  // handles comparison when option.jsonProtocol set to true
  const equalities = expected.map((expectedMsg) =>
    received.messages.some((receivedMsg) =>
      this.equals(receivedMsg, expectedMsg),
    ),
  );

  let pass: boolean;

  if (options?.partial) {
    pass = equalities.every(Boolean);
  } else if (this.isNot) {
    pass = equalities.some(Boolean);
  } else {
    pass = this.equals(received.messages, expected);
  }

  return {
    actual: received.messages,
    expected,
    pass,
    message: () => {
      const printCli = createFmt.call(this, 'toHaveResolvedMessages');

      if (this.isNot) {
        return printCli`
          Expected the WebSocketServer to not have received the following messages: 
            ${this.utils.printExpected(expected)}
          
          But it received: 
            ${this.utils.printReceived(received.messages)}
        `;
      }

      return printCli`
        Expected the WebSocketServer to have received all of the following messages: 
          ${this.utils.printExpected(expected)}

        But it received: 
          ${this.utils.printReceived(received.messages)}
      `;
    },
  };
}
