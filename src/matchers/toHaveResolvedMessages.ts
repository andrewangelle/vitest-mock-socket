import type { MatcherState } from '@vitest/expect';
import { diff } from '@vitest/utils/diff';
import type { DeserializedMessage, ReceiveMessageOptions } from '../types';
import {
  createFmt,
  getInvalidServerResult,
  getNextMessageOrTimeout,
  isTimeout,
  resolveAllClientMessages,
} from '../utils';
import { WebSocketServer } from '../websocket';

/**
 *
 * @name toHaveResolvedMessages
 * @description
 *
 * 1. Validate that a websocket server was passed to expect.
 *    i.e. expect(server).toHaveReceivedMessages(...)
 *
 * 2. Test and print the results
 */
export async function toHaveResolvedMessages(
  this: MatcherState,
  received: DeserializedMessage[],
  expected: DeserializedMessage[],
  options?: ReceiveMessageOptions,
) {
  if (!(received instanceof WebSocketServer)) {
    return getInvalidServerResult.call(
      this,
      'toHaveResolvedMessages',
      received,
    );
  }

  await resolveAllClientMessages(received, options);

  // Handle option.jsonProtocol set to true
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
