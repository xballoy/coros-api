import { z } from 'zod/v4';

export class ValidationError extends Error {
  public readonly error: z.ZodError;
  public readonly options?: ErrorOptions;

  constructor(error: z.ZodError, options?: ErrorOptions) {
    super(z.prettifyError(error), options);
    this.options = options;
    this.error = error;
    this.name = 'ValidationError';
  }
}
