import type { AsyncExpectationResult, MatcherState } from '@vitest/expect';
import {
  createGetInvalidServerResult,
  getNextMessageOrTimeout,
  isTimeout,
} from '~/matchers/shared-utils';
import {
  createGetTimedOutResult,
  createToReceiveMessagesOutput,
} from '~/matchers/toReceiveMessage/utils';
import type { DeserializedMessage, MessageMatcherOptions } from '~/types';
import { WebSocketServer } from '~/websocket';

export async function toReceiveMessage(
  this: MatcherState,
  received: WebSocketServer,
  expected: DeserializedMessage,
  options?: MessageMatcherOptions,
): AsyncExpectationResult {
  const getInvalidServerResult = createGetInvalidServerResult.bind(this);
  const getTimedOutResult = createGetTimedOutResult.bind(this);
  const getMessage = createToReceiveMessagesOutput.bind(this);

  // Validate that a websocket server was passed to expect.
  // i.e. await expect(server).toReceiveMessage(...)
  if (!(received instanceof WebSocketServer)) {
    return getInvalidServerResult('toReceiveMessage', received);
  }

  // Wait for the message or timeout. Fail if we timeout first.
  const result = await getNextMessageOrTimeout(received, options);

  if (isTimeout(result)) {
    return getTimedOutResult(options);
  }

  // Test and print the results
  const pass = this.equals(result, expected);
  return {
    actual: result,
    expected,
    pass,
    message: () => getMessage(pass, result, expected),
  };
}
