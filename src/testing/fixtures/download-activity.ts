export function buildDownloadActivityDetailResponse(fileUrl: string) {
  return {
    apiCode: 'D755ECA8',
    message: 'OK',
    result: '0000',
    data: { fileUrl },
  };
}
