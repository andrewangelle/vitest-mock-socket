import type { MatcherState } from '@vitest/expect';
import { diff } from '@vitest/utils/diff';
import { expect } from 'vitest';

import type { DeserializedMessage, ReceiveMessageOptions } from './types';
import {
  createFmt,
  getInvalidServerResult,
  getNextMessageOrTimeout,
  getTimedOutResult,
  isTimeout,
} from './utils';
import { WebSocketServer } from './websocket';

interface CustomMatchers<MatcherResult = unknown> {
  toReceiveMessage<MessageType = object>(
    message: DeserializedMessage<MessageType>,
    options?: ReceiveMessageOptions,
  ): Promise<MatcherResult>;
  toHaveReceivedMessages<MessageType = object>(
    messages: DeserializedMessage<MessageType>[],
  ): MatcherResult;
}

declare module '@vitest/expect' {
  // biome-ignore lint/suspicious/noExplicitAny: required to extend vitest matchers
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  /**
   *
   * @name toHaveReceivedMessages
   * @description
   *
   * 1. Validate that a websocket server was passed to expect.
   *    i.e. expect(server).toHaveReceivedMessages(...)
   *
   * 2. Test and print the results
   */
  toHaveReceivedMessages(
    this: MatcherState,
    received: DeserializedMessage[],
    expected: DeserializedMessage[],
  ) {
    if (!(received instanceof WebSocketServer)) {
      return getInvalidServerResult.call(
        this,
        'toHaveReceivedMessages',
        received,
      );
    }

    // Handle option.jsonProtocol set to true
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
  },

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
  async toReceiveMessage(
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
  },
});
