import { diff } from '@vitest/utils/diff';
import { createPrintCli } from '../shared-utils';

import type { MatcherState } from '@vitest/expect/dist';
import type { DeserializedMessage } from '../../types';

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
