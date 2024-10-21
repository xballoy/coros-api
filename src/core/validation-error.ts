import type { z } from 'zod';

export class ValidationError extends Error {
  constructor(
    public readonly issues: z.ZodIssue[],
    public readonly options?: ErrorOptions,
  ) {
    super(ValidationError.getMessage(issues), options);
    this.name = 'ValidationError';
  }

  private static getMessage(issues: z.ZodIssue[]): string {
    return Object.entries(issues.flat())
      .map(([key, issue]) => `${issue.path.join('.')} => ${issue.message}`)
      .join(', ');
  }
}
