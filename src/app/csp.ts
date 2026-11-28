// Content Security Policy。<meta> で配信する(<meta> では frame-ancestors などは効かない)。
// nosniff・Referrer-Policy・キャッシュなどのレスポンスヘッダーは public/_headers(Cloudflare Pages の形式)で付けている。
// CSP をヘッダーで配信する件は #14。
// 目的は「入力はブラウザ内で処理され、送信されません」の裏付けで、通信先(connect-src など)を
// 自サイトと Google Analytics に限定する。
// Next.js の App Router は各ページに内容の異なるインラインスクリプト(self.__next_f.push(...))を出力し、
// MUI(Emotion)は <style> を挿入するため、script-src / style-src には 'unsafe-inline' が必要になる。
// GA4 の許可先は Google の案内(https://developers.google.com/tag-platform/security/guides/csp)に従う。
const GA_HOSTS = [
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://*.googletagmanager.com",
];

const directives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://*.googletagmanager.com"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", ...GA_HOSTS],
  "font-src": ["'self'"],
  "connect-src": ["'self'", ...GA_HOSTS],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};

export const CONTENT_SECURITY_POLICY = Object.entries(directives)
  .map(([name, values]) => `${name} ${values.join(" ")}`)
  .join("; ");
