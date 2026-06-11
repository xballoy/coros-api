import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ValidationError } from '../core/validation-error';
import { BaseRequest } from './base-request';
import { CorosResponse } from './common';

const TestInput = z.object({
  name: z.string(),
  flag: z.number().default(1),
});
type TestInput = z.infer<typeof TestInput>;

const TestData = z.object({
  accessToken: z.string(),
  required: z.string(),
});

const TestResponse = CorosResponse(TestData);
type TestResponse = z.infer<typeof TestResponse>;

class TestRequest extends BaseRequest<TestInput, TestResponse, TestInput> {
  protected inputValidator(): z.Schema<TestInput> {
    return TestInput;
  }

  protected responseValidator(): z.Schema<TestResponse> {
    return TestResponse;
  }

  protected async handle(args: TestInput): Promise<TestInput> {
    return args;
  }

  public assertBase(data: unknown): void {
    this.assertCorosResponseBase(data);
  }

  public assertResponse(data: unknown): void {
    this.assertCorosResponse(data);
  }
}

describe('BaseRequest', () => {
  describe('run', () => {
    it('passes the parsed input to handle, with schema defaults applied', async () => {
      const request = new TestRequest();
      const received = await request.run({ name: 'a name' } as TestInput);
      expect(received).toEqual({ name: 'a name', flag: 1 });
    });

    it('throws ValidationError when the input is invalid', async () => {
      const request = new TestRequest();
      await expect(request.run({} as TestInput)).rejects.toThrow(ValidationError);
    });
  });

  describe('assertCorosResponseBase', () => {
    it('accepts a well-formed successful response', () => {
      const request = new TestRequest();
      expect(() => request.assertBase({ apiCode: 'api', message: 'OK', result: '0000' })).not.toThrow();
    });

    it('throws ValidationError when the response shape is invalid', () => {
      const request = new TestRequest();
      expect(() => request.assertBase({ unexpected: true })).toThrow(ValidationError);
    });

    it('throws the API message when result is not 0000', () => {
      const request = new TestRequest();
      expect(() => request.assertBase({ apiCode: 'api', message: 'Invalid credentials', result: '1001' })).toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('assertCorosResponse', () => {
    it('throws ValidationError with the accessToken redacted from the cause', () => {
      const request = new TestRequest();
      const response = {
        apiCode: 'api',
        message: 'OK',
        result: '0000',
        data: { accessToken: 'secret-token' },
      };

      let thrown: unknown;
      try {
        request.assertResponse(response);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(ValidationError);
      const { cause } = thrown as ValidationError;
      expect(JSON.stringify(cause)).not.toContain('secret-token');
      expect(JSON.stringify(cause)).toContain('<redacted>');
    });
  });
});
