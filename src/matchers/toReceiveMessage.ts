import type { MatcherState } from '@vitest/expect';
import { diff } from '@vitest/utils/diff';

import type { DeserializedMessage, MessageMatcherOptions } from '../types';
import { WebSocketServer } from '../websocket';
import {
  createFmt,
  getInvalidServerResult,
  getNextMessageOrTimeout,
  getTimedOutResult,
  isTimeout,
} from './utils';

export async function toReceiveMessage(
  this: MatcherState,
  received: DeserializedMessage,
  expected: DeserializedMessage,
  options?: MessageMatcherOptions,
) {
  const printCli = createFmt.call(this, 'toReceiveMessage');

  // Validate that a websocket server was passed to expect.
  // i.e. await expect(server).toReceiveMessage(...)
  if (!(received instanceof WebSocketServer)) {
    return getInvalidServerResult.call(this, 'toReceiveMessage', received);
  }

  // Wait for the message or timeout. Fail if we timeout first.
  const result = await getNextMessageOrTimeout(received, options);

  if (isTimeout(result)) {
    return getTimedOutResult.call(this, options);
  }

  // Test and print the results
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
