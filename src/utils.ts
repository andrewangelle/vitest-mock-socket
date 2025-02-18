import type { ExpectationResult, MatcherState } from '@vitest/expect/dist';
import { diff } from '@vitest/utils/diff';

import type { DeserializedMessage, ReceiveMessageOptions } from './types';
import type { WebSocketServer } from './websocket';

/**
 * Shared utils
 */
export function getMatcherHint(this: MatcherState, name: string) {
  return this.utils.matcherHint(
    this.isNot ? `.not.${name}` : `.${name}`,
    'WebSocketServer',
    'expected',
  );
}

export function getInvalidServerResult(
  this: MatcherState,
  name: string,
  received: DeserializedMessage | DeserializedMessage[],
): ExpectationResult {
  const matcherHint = getMatcherHint.call(this, name);
  return {
    pass: this.isNot, // always fail
    message: () => {
      const expected =
        'Expected the websocket object to be a valid WebSocketServer mock.\n';
      const receivedMsg = `Received: ${typeof received}\n  ${this.utils.printReceived(received)}`;
      return `${matcherHint}\n\n${expected}${receivedMsg}`;
    },
  };
}

/**
 * toHaveReceivedMessages utils
 */
export function getToHaveReceivedMessagesStrings(
  this: MatcherState,
  received: DeserializedMessage[],
  expected: DeserializedMessage[],
) {
  const matcherHint = getMatcherHint.call(this, 'toHaveReceivedMessages');
  return {
    toHave: {
      expected: `Expected the WebSocketServer to have received the following messages:\n  ${this.utils.printExpected(expected)}\n`,
      receivedMsg: `Received:\n  ${this.utils.printReceived(received)}\n\n`,
    },
    notToHave: {
      expected: `Expected the WebSocketServer to not have received the following messages:\n  ${this.utils.printExpected(expected)}\n`,
      receivedMsg: `But it received:\n  ${this.utils.printReceived(received)}`,
    },
    printToHave() {
      const { expected, receivedMsg } = this.toHave;
      return `${matcherHint}\n\n${expected}${receivedMsg}`;
    },
    printNotToHave() {
      const { expected, receivedMsg } = this.notToHave;
      return `${matcherHint}\n\n${expected}${receivedMsg}`;
    },
  };
}

/**
 * toReceiveMessage utils
 */
export function getToReceiveMessageStrings(
  this: MatcherState,
  received: DeserializedMessage,
  expected: DeserializedMessage,
) {
  const matcherHint = getMatcherHint.call(this, 'toReceiveMessage');
  return {
    toEqual: {
      expected: `Expected the next received message to equal:\n  ${this.utils.printExpected(expected)}\n`,
      received: `Received:\n  ${this.utils.printReceived(received)}\n\n`,
      diff: `Difference:\n\n${diff(expected, received, { expand: this.expand })}`,
    },
    notToEqual: {
      expected: `Expected the next received message to not equal:\n  ${this.utils.printExpected(expected)}\n`,
      received: `Received:\n  ${this.utils.printReceived(received)}`,
    },
    printToEqualFailed() {
      const { expected, received, diff } = this.toEqual;
      return `${matcherHint}\n\n${expected}${received}${diff}`;
    },
    printNotToEqualFailed() {
      const { expected, received } = this.notToEqual;
      return `${matcherHint}\n\n${expected}${received}`;
    },
  };
}

const WAIT_DELAY = 1000;
const TIMEOUT = Symbol('timeout');

export function isTimeout(
  result: DeserializedMessage | symbol,
): result is symbol {
  return result === TIMEOUT;
}

export async function getNextMessageOrTimeout(
  server: WebSocketServer,
  options?: ReceiveMessageOptions,
) {
  const waitDelay = options?.timeout ?? WAIT_DELAY;
  const timeout = Promise.withResolvers();
  const timer = setTimeout(() => timeout.resolve(TIMEOUT), waitDelay);

  try {
    const receivedMsg = await Promise.race<DeserializedMessage | symbol>([
      server.nextMessage(),
      timeout.promise,
    ]);

    return receivedMsg;
  } finally {
    clearTimeout(timer);
  }
}

export function getTimedOutResult(
  this: MatcherState,
  options?: ReceiveMessageOptions,
) {
  const matcherHint = getMatcherHint.call(this, 'toReceiveMessage');
  const waitDelay = options?.timeout ?? WAIT_DELAY;
  return {
    pass: this.isNot, // always fail
    message: () => {
      const expected = 'Expected the websocket server to receive a message,\n';
      const receivedMsg = `but it didn't receive anything in ${waitDelay}ms.`;
      return `${matcherHint}\n\n${expected}${receivedMsg}`;
    },
  };
}
