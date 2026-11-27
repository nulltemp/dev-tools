import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// git コマンドを実行して標準出力を返す。失敗したら例外を投げる
export type Git = (args: string[]) => string;

const runGit: Git = (args) =>
  execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

// 浅いクローンの境界のコミット(.git/shallow に並ぶ)。そのコミットより前の履歴はない
const shallowCommits = (git: Git): Set<string> => {
  const file = git(["rev-parse", "--path-format=absolute", "--git-path", "shallow"]);
  if (!existsSync(file)) return new Set();
  return new Set(readFileSync(file, "utf8").split("\n").filter(Boolean));
};

// paths を最後に変更したコミットの日付(YYYY-MM-DD)。sitemap.xml の <lastmod> に使う。
// git がない・履歴にない・浅いクローンの境界のコミット(本当の変更日はそれより前かもしれない)のときは
// 正しい日付が分からないので undefined を返し、<lastmod> を省く
export const lastModified = (paths: string[], git: Git = runGit): string | undefined => {
  try {
    const log = git(["log", "-1", "--format=%H %cs", "--", ...paths]);
    const [hash, date] = log.split(" ");
    if (!hash || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) return undefined;
    if (shallowCommits(git).has(hash)) return undefined;
    return date;
  } catch {
    return undefined;
  }
};
