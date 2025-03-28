import type { ExpectationResult, MatcherState } from '@vitest/expect';
import { createGetInvalidServerResult } from '~/matchers/shared-utils';
import { createToHaveReceivedMessagesOutput } from '~/matchers/toHaveReceivedMessages/utils';
import type { DeserializedMessage } from '~/types';
import { WebSocketServer } from '~/websocket';

export function toHaveReceivedMessages(
  this: MatcherState,
  received: WebSocketServer,
  expected: DeserializedMessage[],
): ExpectationResult {
  const getInvalidServerResult = createGetInvalidServerResult.bind(this);
  const getMessage = createToHaveReceivedMessagesOutput.bind(this);

  // Validate that a websocket server was passed to expect.
  // i.e. expect(server).toHaveReceivedMessages(...)
  if (!(received instanceof WebSocketServer)) {
    return getInvalidServerResult('toHaveReceivedMessages', received);
  }

  // handles comparison with json objects
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
    message: () => getMessage(expected, received.messages),
  };
}
