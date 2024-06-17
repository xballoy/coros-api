import OS from 'node:os';
import type { z } from 'zod';

export class ValidationError<T> extends Error {
  constructor(
    public readonly issues: z.ZodIssue[],
    public readonly options?: ErrorOptions,
  ) {
    super(ValidationError.getMessage(issues), options);
    this.name = 'ValidationError';
  }

  private static getMessage(issues: z.ZodIssue[]): string {
    return Object.entries(issues.flat())
      .map(([key, values]) => `${key} => ${values?.message}`)
      .join(OS.EOL);
  }
}
