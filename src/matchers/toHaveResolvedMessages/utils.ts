import {
  createPrintCli,
  getNextMessageOrTimeout,
  isTimeout,
} from '../shared-utils';

import type { MatcherState } from '@vitest/expect/dist';
import type { DeserializedMessage, MessageMatcherOptions } from '~/types';
import type { WebSocketServer } from '~/websocket';

export async function resolveAllClientMessages(
  server: WebSocketServer,
  options?: MessageMatcherOptions,
) {
  const finished = Promise.withResolvers<void>();

  let shouldContinue = true;

  while (shouldContinue) {
    const msgOrTimeout = await getNextMessageOrTimeout(server, options);

    if (isTimeout(msgOrTimeout)) {
      shouldContinue = false;
      finished.resolve();
    }
  }

  return finished.promise;
}

export function createToHaveResolvedMessagesOutput(
  this: MatcherState,
  expected: DeserializedMessage[],
  received: DeserializedMessage[],
) {
  const printCli = createPrintCli.call(this, 'toHaveResolvedMessages');

  if (this.isNot) {
    return printCli`
      Expected the WebSocketServer to not have received the following messages: 
        ${this.utils.printExpected(expected)}
      
      But it received: 
        ${this.utils.printReceived(received)}
    `;
  }

  return printCli`
    Expected the WebSocketServer to have received all of the following messages: 
      ${this.utils.printExpected(expected)}

    But it received: 
      ${this.utils.printReceived(received)}
  `;
}
