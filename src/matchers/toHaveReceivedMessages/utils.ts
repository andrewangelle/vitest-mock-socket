import { createPrintCli } from '../shared-utils';

import type { MatcherState } from '@vitest/expect/dist';
import type { DeserializedMessage } from '../../types';

export function createToHaveReceivedMessagesOutput(
  this: MatcherState,
  expected: DeserializedMessage[],
  received: DeserializedMessage[],
) {
  const printCli = createPrintCli.call(this, 'toHaveReceivedMessages');

  if (this.isNot) {
    return printCli`
      Expected the WebSocketServer to not have received the following messages: 
        ${this.utils.printExpected(expected)}
      
      But it received: 
        ${this.utils.printReceived(received)}
    `;
  }

  return printCli`
    Expected the WebSocketServer to have received the following messages: 
      ${this.utils.printExpected(expected)}

    Received: 
      ${this.utils.printReceived(received)}
  `;
}
