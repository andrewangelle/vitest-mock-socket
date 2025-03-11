import type { ExpectationResult, MatcherState } from '@vitest/expect/dist';
import type { DeserializedMessage, MessageMatcherOptions } from '../types';
import type { WebSocketServer } from '../websocket';

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

export function getTimedOutResult(
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

export function createPrintCli(this: MatcherState, name: string) {
  const matcherHint = getMatcherHint.call(this, name);

  return (templates: TemplateStringsArray, ...values: string[]) => {
    let result = '';

    for (const template of templates.filter(Boolean)) {
      const idx = templates.indexOf(template);
      const lineBreak = '\n';
      const indentedOutput = values[idx]
        ?.split(lineBreak)
        .filter(Boolean)
        .map((line) => `  ${line}`)
        .join(lineBreak);

      result += `${template.trim()}\n\n${indentedOutput}\n\n`;
    }

    const [formatted] = result.split(/(\n+undefined+\n)/);

    return `${matcherHint}\n\n${formatted}\n`;
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
  options?: MessageMatcherOptions,
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
