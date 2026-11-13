import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateUserDto } from '@/users/dto/create-user.dto';
import * as enMessages from '@/i18n/en-US/messages.json';
import * as trMessages from '@/i18n/tr-TR/messages.json';

async function failureMessages(payload: object): Promise<Array<string>> {
  const errors = await validate(plainToInstance(CreateUserDto, payload));
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

// `i18nValidationMessage('messages.users.X')` produces "messages.users.X|{...}"
const keyOf = (message: string): string => message.split('|')[0];

const lookup = (messages: object, key: string): unknown =>
  key
    .replace(/^messages\./, '')
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      messages,
    );

describe('CreateUserDto validation messages', () => {
  const invalidPayloads: Array<[string, object]> = [
    ['missing fields', {}],
    [
      'empty name, malformed email, short password',
      { name: '', email: 'nope', password: 'abc' },
    ],
    [
      'non-string name and password',
      { name: 123, email: 'user@example.com', password: 123 },
    ],
  ];

  it('accepts a valid payload', async () => {
    await expect(
      failureMessages({
        name: 'Jane',
        email: 'user@example.com',
        password: 'secret123',
      }),
    ).resolves.toEqual([]);
  });

  it.each(invalidPayloads)(
    'reports translation keys, not default English text (%s)',
    async (_, payload) => {
      const messages = await failureMessages(payload);

      expect(messages.length).toBeGreaterThan(0);
      for (const message of messages) {
        expect(message).toMatch(/^messages\.users\./);
      }
    },
  );

  it.each(invalidPayloads)(
    'only references keys that exist in both en-US and tr-TR (%s)',
    async (_, payload) => {
      const keys = (await failureMessages(payload)).map(keyOf);

      for (const key of keys) {
        expect({ key, en: typeof lookup(enMessages, key) }).toEqual({
          key,
          en: 'string',
        });
        expect({ key, tr: typeof lookup(trMessages, key) }).toEqual({
          key,
          tr: 'string',
        });
      }
    },
  );

  it('uses a distinct message per rule so one field never repeats a line', async () => {
    const messages = await failureMessages({});

    expect(new Set(messages).size).toBe(messages.length);
  });
});
