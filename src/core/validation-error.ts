import OS from 'node:os';
import { type SchemaIssue, flatten } from 'valibot';

export class ValidationError extends Error {
  constructor(
    public readonly issues: [SchemaIssue, ...SchemaIssue[]],
    public readonly options?: ErrorOptions,
  ) {
    super(ValidationError.getMessage(issues), options);
    this.name = 'ValidationError';
  }

  private static getMessage(issues: [SchemaIssue, ...SchemaIssue[]]): string {
    const flatErrors = flatten(issues);
    const rootError = flatErrors.root?.join(', ');
    const nestedErrors = Object.entries(flatErrors.nested).map(([key, values]) => `${key} => ${values?.join(', ')}`);
    return [rootError, ...nestedErrors].filter((it) => !!it).join(OS.EOL);
  }
}
