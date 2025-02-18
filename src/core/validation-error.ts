import type { z } from 'zod';

export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[];
  public readonly options?: ErrorOptions;

  constructor(issues: z.ZodIssue[], options?: ErrorOptions) {
    super(ValidationError.getMessage(issues), options);
    this.options = options;
    this.issues = issues;
    this.name = 'ValidationError';
  }

  private static getMessage(issues: z.ZodIssue[]): string {
    return Object.entries(issues.flat())
      .map(([_, issue]) => `${issue.path.join('.')} => ${issue.message}`)
      .join(', ');
  }
}
