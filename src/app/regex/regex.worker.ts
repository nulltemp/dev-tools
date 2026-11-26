// 正規表現の照合を行う Web Worker。破滅的なバックトラッキング((a+)+$ など)で止まらなくなっても、
// ページ側がタイムアウトで terminate できるようメインスレッドの外で動かす。
// ファイルとしてバンドルされ同一オリジンから読み込むので、CSP は default-src 'self' で足りる
import { runRegex, type RegexInput } from "./regex";

export interface RegexRequest {
  id: number;
  input: RegexInput;
}

self.onmessage = (event: MessageEvent<RegexRequest>) => {
  const { id, input } = event.data;
  self.postMessage({ id, result: runRegex(input) });
};
