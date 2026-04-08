export function buildLoginResponse(accessToken = 'test-access-token') {
  return {
    apiCode: '41C2B95C',
    message: 'OK',
    result: '0000',
    data: { accessToken },
  };
}
