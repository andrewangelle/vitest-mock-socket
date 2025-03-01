import { expect } from 'vitest';

import { toHaveReceivedMessages } from './matchers/toHaveReceivedMessages';
import { toHaveResolvedMessages } from './matchers/toHaveResolvedMessages';
import { toReceiveMessage } from './matchers/toReceiveMessage';
import type { DeserializedMessage, MessageMatcherOptions } from './types';

interface CustomMatchers<MatcherResult = unknown> {
  toReceiveMessage<MessageType = object>(
    message: DeserializedMessage<MessageType>,
    options?: MessageMatcherOptions,
  ): Promise<MatcherResult>;
  toHaveReceivedMessages<MessageType = object>(
    messages: DeserializedMessage<MessageType>[],
  ): MatcherResult;
  toHaveResolvedMessages<MessageType = object>(
    messages: DeserializedMessage<MessageType>[],
    options?: MessageMatcherOptions,
  ): Promise<MatcherResult>;
}

declare module '@vitest/expect' {
  // biome-ignore lint/suspicious/noExplicitAny: required to extend vitest matchers
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toHaveReceivedMessages,
  toReceiveMessage,
  toHaveResolvedMessages,
});
