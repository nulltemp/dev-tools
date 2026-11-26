// 正規表現テスターのロジック(UI から切り離した純粋な関数)。
// 照合は regex.worker.ts から呼び、破滅的なバックトラッキングでもタブが固まらないようにする

export const REGEX_FLAGS = [
  { flag: "g", label: "全体(g)" },
  { flag: "i", label: "大文字・小文字を無視(i)" },
  { flag: "m", label: "複数行(m)" },
  { flag: "s", label: "「.」が改行にも一致(s)" },
  { flag: "u", label: "Unicode(u)" },
  { flag: "v", label: "Unicode 集合(v)" },
  { flag: "y", label: "先頭から連続(y)" },
] as const;
export type RegexFlag = (typeof REGEX_FLAGS)[number]["flag"];

// 一致が多すぎると一覧と強調表示が重くなるので、表示する件数に上限を設ける
export const MAX_MATCHES = 1000;

export interface RegexGroup {
  // 番号付きは "1"、"2"…、名前付きは "<name>"
  label: string;
  value: string | undefined;
}

export interface RegexMatch {
  index: number;
  end: number;
  text: string;
  groups: RegexGroup[];
}

export interface RegexInput {
  pattern: string;
  flags: string;
  text: string;
  // undefined なら置換しない
  replacement?: string;
}

export type RegexResult =
  | {
      error?: undefined;
      matches: RegexMatch[];
      // MAX_MATCHES で打ち切ったか
      truncated: boolean;
      replaced?: string;
    }
  | { error: string };

// フラグを決まった順に並べ、重複を除く
export const normalizeFlags = (flags: Iterable<string>): string => {
  const set = new Set(flags);
  return REGEX_FLAGS.map((f) => f.flag)
    .filter((f) => set.has(f))
    .join("");
};

export const compileRegex = (
  pattern: string,
  flags: string
): { regex: RegExp; error?: undefined } | { regex?: undefined; error: string } => {
  try {
    return { regex: new RegExp(pattern, flags) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `正規表現が正しくありません(${message})。` };
  }
};

const toMatch = (m: RegExpExecArray): RegexMatch => {
  const groups: RegexGroup[] = [];
  for (let i = 1; i < m.length; i++) groups.push({ label: String(i), value: m[i] });
  for (const [name, value] of Object.entries(m.groups ?? {})) {
    groups.push({ label: `<${name}>`, value });
  }
  return { index: m.index, end: m.index + m[0].length, text: m[0], groups };
};

// 一致を列挙する。g がなければ最初の1件だけ(String.prototype.match と同じ)。
// 空文字に一致するパターン(a* など)でも止まるよう、lastIndex を必ず進める
export const findMatches = (
  regex: RegExp,
  text: string,
  limit = MAX_MATCHES
): { matches: RegexMatch[]; truncated: boolean } => {
  // 呼び出し元の lastIndex を変えないよう複製する
  const re = new RegExp(regex.source, regex.flags);
  if (!re.global) {
    const m = re.exec(text);
    return { matches: m ? [toMatch(m)] : [], truncated: false };
  }
  const unicode = re.unicode || re.unicodeSets;
  const matches: RegexMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (matches.length >= limit) return { matches, truncated: true };
    matches.push(toMatch(m));
    if (m[0] === "") {
      // サロゲートペアの途中で止まらないよう、u / v のときはコードポイント単位で進める
      const code = text.codePointAt(re.lastIndex);
      re.lastIndex += unicode && code !== undefined && code > 0xffff ? 2 : 1;
    }
  }
  return { matches, truncated: false };
};

// 置換結果。$1・$<name>・$& などは String.prototype.replace の規則どおり
export const replaceText = (regex: RegExp, text: string, replacement: string): string =>
  text.replace(new RegExp(regex.source, regex.flags), replacement);

export const runRegex = ({ pattern, flags, text, replacement }: RegexInput): RegexResult => {
  const compiled = compileRegex(pattern, flags);
  if (compiled.error !== undefined) return { error: compiled.error };
  const { matches, truncated } = findMatches(compiled.regex, text);
  return {
    matches,
    truncated,
    replaced: replacement === undefined ? undefined : replaceText(compiled.regex, text, replacement),
  };
};

export interface Segment {
  text: string;
  // 一致した部分なら一致の番号(0 始まり)
  match?: number;
}

// 強調表示のためにテキストを一致と非一致に分ける。空文字の一致は区切らない
export const splitByMatches = (text: string, matches: RegexMatch[]): Segment[] => {
  const segments: Segment[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.end === m.index || m.index < pos) return;
    if (m.index > pos) segments.push({ text: text.slice(pos, m.index) });
    segments.push({ text: text.slice(m.index, m.end), match: i });
    pos = m.end;
  });
  if (pos < text.length) segments.push({ text: text.slice(pos) });
  return segments;
};
