import type { AsyncExpectationResult, MatcherState } from '@vitest/expect';
import type { DeserializedMessage, MessageMatcherOptions } from '../../types';
import { WebSocketServer } from '../../websocket';
import { createGetInvalidServerResult } from '../shared-utils';
import {
  createToHaveResolvedMessagesOutput,
  resolveAllClientMessages,
} from './utils';

export async function toHaveResolvedMessages(
  this: MatcherState,
  received: WebSocketServer,
  expected: DeserializedMessage[],
  options?: MessageMatcherOptions,
): AsyncExpectationResult {
  const getInvalidServerResult = createGetInvalidServerResult.bind(this);
  const getMessage = createToHaveResolvedMessagesOutput.bind(this);

  // Validate that a websocket server was passed to expect.
  // i.e. expect(server).toHaveResolved(...)
  if (!(received instanceof WebSocketServer)) {
    return getInvalidServerResult('toHaveResolvedMessages', received);
  }

  await resolveAllClientMessages(received, options);

  // handles comparison with json objects
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
    message: () => getMessage(expected, received.messages),
  };
}
