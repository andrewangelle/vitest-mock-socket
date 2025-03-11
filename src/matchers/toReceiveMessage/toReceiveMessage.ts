import type { MatcherState } from '@vitest/expect';

import type { DeserializedMessage, MessageMatcherOptions } from '../../types';
import { WebSocketServer } from '../../websocket';
import {
  getInvalidServerResult,
  getNextMessageOrTimeout,
  getTimedOutResult,
  isTimeout,
} from '../shared-utils';
import { createToReceiveMessagesOutput } from './utils';

export async function toReceiveMessage(
  this: MatcherState,
  received: DeserializedMessage,
  expected: DeserializedMessage,
  options?: MessageMatcherOptions,
) {
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
  const getMessage = createToReceiveMessagesOutput.bind(this);
  return {
    actual: result,
    expected,
    pass,
    message: () => getMessage(pass, result, expected),
  };
}
