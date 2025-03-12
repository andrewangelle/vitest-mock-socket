import type { MatcherState } from '@vitest/expect/dist';
import { diff } from '@vitest/utils/diff';
import type { DeserializedMessage, MessageMatcherOptions } from '../../types';
import { WAIT_DELAY, createPrintCli, getMatcherHint } from '../shared-utils';

export function createGetTimedOutResult(
  this: MatcherState,
  options?: MessageMatcherOptions,
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

export function createToReceiveMessagesOutput(
  this: MatcherState,
  pass: boolean,
  result: DeserializedMessage,
  expected: DeserializedMessage,
) {
  const printCli = createPrintCli.call(this, 'toReceiveMessage');

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
}
