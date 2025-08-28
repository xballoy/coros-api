export type ConfigurationService = {
  apiUrl: string;
  email: string;
  hashedPassword: string;
};

export const CONFIGURATION_SERVICE_TOKEN = Symbol('CONFIGURATION_SERVICE');
