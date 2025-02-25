import type { MatcherState } from '@vitest/expect';
import { diff } from '@vitest/utils/diff';

import type { DeserializedMessage, ReceiveMessageOptions } from '../types';
import {
  createFmt,
  getInvalidServerResult,
  getNextMessageOrTimeout,
  getTimedOutResult,
  isTimeout,
} from '../utils';
import { WebSocketServer } from '../websocket';

/**
 *
 * @name toReceiveMessage
 * @description
 *
 * 1. Validate that a websocket server was passed to expect.
 *    i.e. await expect(server).toReceiveMessage(...)
 *
 * 2. Wait for the message or timeout. Fail if we timeout first.
 *
 * 3. Test and print the results
 *
 */
export async function toReceiveMessage(
  this: MatcherState,
  received: DeserializedMessage,
  expected: DeserializedMessage,
  options?: ReceiveMessageOptions,
) {
  const printCli = createFmt.call(this, 'toReceiveMessage');

  if (!(received instanceof WebSocketServer)) {
    return getInvalidServerResult.call(this, 'toReceiveMessage', received);
  }

  const result = await getNextMessageOrTimeout(received, options);

  if (isTimeout(result)) {
    return getTimedOutResult.call(this, options);
  }

  const pass = this.equals(result, expected);

  return {
    actual: result,
    expected,
    pass,
    message: () => {
      if (pass) {
        return printCli`
          Expected the next received message to not equal:
            ${this.utils.printExpected(expected)}

          Received:
            ${this.utils.printReceived(result)}
        `;
      }

      return printCli`
        Expected the next received message to equal:
          ${this.utils.printExpected(expected)}

        Received:
          ${this.utils.printReceived(result)}

        Difference:
          ${diff(expected, result, { expand: this.expand }) ?? ''}
      `;
    },
  };
}
