export class InvalidParameterError extends Error {
  constructor(parameterName: string, reason?: string) {
    super(`Invalid parameter ${parameterName}${reason ? `: ${reason}` : ''}`);
    this.name = 'InvalidParameterError';
  }
}
