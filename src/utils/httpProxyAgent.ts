import { HttpsProxyAgent } from 'https-proxy-agent';

export function getHttpProxyAgent() {
  // n8n 환경에서 안전하게 환경 변수 접근
  let httpProxy: string | undefined;
  
  try {
    // Node.js 환경에서만 환경 변수 접근
    if (typeof process !== 'undefined' && process.env) {
      httpProxy =
        process.env.HTTPS_PROXY ??
        process.env.https_proxy ??
        process.env.HTTP_PROXY ??
        process.env.http_proxy;
    }
  } catch (error) {
    // 환경 변수 접근 실패 시 무시
    httpProxy = undefined;
  }

  return httpProxy ? new HttpsProxyAgent(httpProxy) : undefined;
}
