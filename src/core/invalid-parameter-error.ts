export class InvalidParameterError extends Error {
  constructor(parameterName: string, value: string, reason: string) {
    super(`Invalid value ${value} for parameter ${parameterName}. ${reason}`);
    this.name = 'InvalidParameterError';
  }
}
