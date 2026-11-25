// テキスト差分の計算(外部パッケージを使わない Myers 法)。UI から切り離した純粋な関数

export interface DiffOptions {
  // 行頭・行末の空白を除き、続く空白を1つとみなして比べる
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
}

// 行の中の差分。changed が true の部分が、もう一方にない文字
export interface Segment {
  text: string;
  changed: boolean;
}

export interface DiffLine {
  type: "equal" | "delete" | "insert";
  // equal の行は変更前の行の内容
  text: string;
  // 1始まりの行番号(insert には oldNo、delete には newNo がない)
  oldNo?: number;
  newNo?: number;
  // 変更された行(削除と追加の組)だけに付く文字単位の差分
  segments?: Segment[];
}

export interface DiffResult {
  lines: DiffLine[];
  added: number;
  removed: number;
  // 差分が大きく計算を打ち切った部分があり、最小の差分になっていないかもしれない
  approximate: boolean;
}

// タブが固まらないよう、入力の大きさと計算量に上限を設ける
export const MAX_LINES = 20000;
// 行単位の編集距離(追加+削除の行数)の上限。超えた部分は「全部削除して全部追加」として扱う
export const MAX_LINE_EDITS = 2000;
// 文字単位の差分を出す行の長さと編集距離の上限
const MAX_CHARS_PER_LINE = 1000;
const MAX_CHAR_EDITS = 200;

export class DiffTooLargeError extends Error {}

// 改行コード(CRLF・CR・LF)の違いと、末尾の改行の有無は区別しない
export const splitLines = (text: string): string[] => {
  if (text === "") return [];
  const lines = text.split(/\r\n|\r|\n/);
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
};

const normalize = (line: string, options: DiffOptions): string => {
  let s = line;
  if (options.ignoreWhitespace) s = s.trim().replace(/\s+/g, " ");
  if (options.ignoreCase) s = s.toLowerCase();
  return s;
};

type Op = "equal" | "delete" | "insert";

// Myers の O(ND) 法で a を b にする最短の編集を求める。編集距離が maxEdits を超えたら null
const myers = (a: number[], b: number[], maxEdits: number): Op[] | null => {
  const n = a.length;
  const m = b.length;
  const max = Math.min(n + m, maxEdits);
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  // trace[d] は d 回目の探索を始める前の v(k = -d..d の範囲だけ)
  const trace: Int32Array[] = [];
  let found = -1;
  for (let d = 0; d <= max && found < 0; d++) {
    trace.push(v.slice(offset - d, offset + d + 1));
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
          ? v[offset + k + 1]
          : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break;
      }
    }
  }
  if (found < 0) return null;

  const ops: Op[] = [];
  let x = n;
  let y = m;
  for (let d = found; d > 0; d--) {
    const snapshot = trace[d];
    const at = (k: number) => snapshot[k + d];
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = at(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push("equal");
      x--;
      y--;
    }
    ops.push(x === prevX ? "insert" : "delete");
    x = prevX;
    y = prevY;
  }
  while (x > 0 && y > 0) {
    ops.push("equal");
    x--;
    y--;
  }
  return ops.reverse();
};

// 先頭と末尾の共通部分を除いてから Myers 法にかける。上限を超えたら真ん中を全部削除・全部追加にする
const diffSequences = (
  a: number[],
  b: number[],
  maxEdits: number
): { ops: Op[]; approximate: boolean } => {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const middle = myers(a.slice(start, endA), b.slice(start, endB), maxEdits);
  const ops: Op[] = Array<Op>(start).fill("equal");
  if (middle) {
    ops.push(...middle);
  } else {
    for (let i = start; i < endA; i++) ops.push("delete");
    for (let i = start; i < endB; i++) ops.push("insert");
  }
  for (let i = endA; i < a.length; i++) ops.push("equal");
  return { ops, approximate: middle === null };
};

// 文字列の配列を、同じ文字列が同じ番号になるよう数値に置き換える(比較を速くするため)
const toIds = (a: string[], b: string[]): [number[], number[]] => {
  const ids = new Map<string, number>();
  const id = (s: string) => {
    let n = ids.get(s);
    if (n === undefined) {
      n = ids.size;
      ids.set(s, n);
    }
    return n;
  };
  return [a.map(id), b.map(id)];
};

const pushSegment = (segments: Segment[], text: string, changed: boolean) => {
  const last = segments[segments.length - 1];
  if (last && last.changed === changed) last.text += text;
  else segments.push({ text, changed });
};

// 変更前・変更後の1行どうしの文字単位の差分。長すぎる・違いすぎる行は undefined
export const diffChars = (
  before: string,
  after: string,
  options: DiffOptions = {}
): { before: Segment[]; after: Segment[] } | undefined => {
  // サロゲートペア(絵文字など)を分けないよう、コードポイントで比べる
  const a = Array.from(before);
  const b = Array.from(after);
  if (a.length > MAX_CHARS_PER_LINE || b.length > MAX_CHARS_PER_LINE) return undefined;
  const key = (c: string) => (options.ignoreCase ? c.toLowerCase() : c);
  const [ia, ib] = toIds(a.map(key), b.map(key));
  const { ops, approximate } = diffSequences(ia, ib, MAX_CHAR_EDITS);
  if (approximate) return undefined;
  const result = { before: [] as Segment[], after: [] as Segment[] };
  let i = 0;
  let j = 0;
  for (const op of ops) {
    if (op === "equal") {
      pushSegment(result.before, a[i++], false);
      pushSegment(result.after, b[j++], false);
    } else if (op === "delete") {
      pushSegment(result.before, a[i++], true);
    } else {
      pushSegment(result.after, b[j++], true);
    }
  }
  return result;
};

export const diffLines = (before: string, after: string, options: DiffOptions = {}): DiffResult => {
  const a = splitLines(before);
  const b = splitLines(after);
  if (a.length > MAX_LINES || b.length > MAX_LINES) {
    throw new DiffTooLargeError(
      `行数が多すぎます(${MAX_LINES.toLocaleString()}行まで比較できます)`
    );
  }
  const [ia, ib] = toIds(
    a.map((line) => normalize(line, options)),
    b.map((line) => normalize(line, options))
  );
  const { ops, approximate } = diffSequences(ia, ib, MAX_LINE_EDITS);

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  for (const op of ops) {
    if (op === "equal") {
      lines.push({ type: "equal", text: a[i], oldNo: i + 1, newNo: j + 1 });
      i++;
      j++;
    } else if (op === "delete") {
      lines.push({ type: "delete", text: a[i], oldNo: i + 1 });
      i++;
    } else {
      lines.push({ type: "insert", text: b[j], newNo: j + 1 });
      j++;
    }
  }
  addCharDiffs(lines, options);
  return {
    lines,
    added: lines.filter((l) => l.type === "insert").length,
    removed: lines.filter((l) => l.type === "delete").length,
    approximate,
  };
};

// 続けて削除・追加された行を先頭から順に組にして、変更された行として文字単位の差分を付ける
const addCharDiffs = (lines: DiffLine[], options: DiffOptions) => {
  let k = 0;
  while (k < lines.length) {
    if (lines[k].type === "equal") {
      k++;
      continue;
    }
    const deletes: DiffLine[] = [];
    const inserts: DiffLine[] = [];
    while (k < lines.length && lines[k].type !== "equal") {
      (lines[k].type === "delete" ? deletes : inserts).push(lines[k]);
      k++;
    }
    const pairs = Math.min(deletes.length, inserts.length);
    for (let p = 0; p < pairs; p++) {
      const chars = diffChars(deletes[p].text, inserts[p].text, options);
      if (!chars) continue;
      deletes[p].segments = chars.before;
      inserts[p].segments = chars.after;
    }
  }
};

const SIGNS = { equal: " ", delete: "-", insert: "+" } as const;

const range = (start: number, count: number) => (count === 1 ? `${start}` : `${start},${count}`);

// unified diff 形式(diff -u と同じ、前後 context 行を含むハンク)にする。差分がなければ空文字列
export const formatUnified = (
  lines: DiffLine[],
  context = 3,
  labels: { before: string; after: string } = { before: "before", after: "after" }
): string => {
  const changed = lines.flatMap((line, index) => (line.type === "equal" ? [] : [index]));
  if (changed.length === 0) return "";

  // 変更の前後 context 行をまとめ、近いものは1つのハンクにする
  const hunks: [number, number][] = [];
  for (const index of changed) {
    const from = Math.max(0, index - context);
    const to = Math.min(lines.length - 1, index + context);
    const last = hunks[hunks.length - 1];
    if (last && from <= last[1] + 1) last[1] = to;
    else hunks.push([from, to]);
  }

  // 各行より前にある変更前・変更後の行数(ハンクの開始位置の計算に使う)
  const oldBefore: number[] = [];
  const newBefore: number[] = [];
  let oldCount = 0;
  let newCount = 0;
  for (const line of lines) {
    oldBefore.push(oldCount);
    newBefore.push(newCount);
    if (line.type !== "insert") oldCount++;
    if (line.type !== "delete") newCount++;
  }

  const out = [`--- ${labels.before}`, `+++ ${labels.after}`];
  for (const [from, to] of hunks) {
    const hunk = lines.slice(from, to + 1);
    const oldLen = hunk.filter((l) => l.type !== "insert").length;
    const newLen = hunk.filter((l) => l.type !== "delete").length;
    // 行数が0のときは、その直前の行番号を書く(diff -u と同じ)
    const oldStart = oldLen === 0 ? oldBefore[from] : oldBefore[from] + 1;
    const newStart = newLen === 0 ? newBefore[from] : newBefore[from] + 1;
    out.push(`@@ -${range(oldStart, oldLen)} +${range(newStart, newLen)} @@`);
    for (const line of hunk) out.push(`${SIGNS[line.type]}${line.text}`);
  }
  return out.join("\n") + "\n";
};
