export function getSafeErrorDetail(error, fallback = 'Something went wrong') {
  const detail = error?.response?.data?.detail;
  return typeof detail === 'string' ? detail : fallback;
}
