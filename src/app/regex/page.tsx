"use client";
import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import CodeBlock from "../CodeBlock";
import ToolPage from "../ToolPage";
import { monoInput } from "../inputStyles";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import {
  MAX_MATCHES,
  normalizeFlags,
  REGEX_FLAGS,
  splitByMatches,
  toggleFlags,
  type RegexInput,
  type RegexMatch,
  type RegexResult,
} from "./regex";
import type { RegexRequest } from "./regex.worker";

const { name, description } = findTool("/regex");

// これより長くかかる照合は、破滅的なバックトラッキングとみなして打ち切る
const TIMEOUT_MS = 2000;
const TIMEOUT_ERROR = `${TIMEOUT_MS / 1000}秒以内に照合が終わらなかったため中断しました。(a+)+ のような、繰り返しを入れ子にしたパターンは極端に時間がかかることがあります。`;

export default function RegexPage() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<string[]>(["g"]);
  const [text, setText] = useState("");
  const [useReplace, setUseReplace] = useState(false);
  const [replacement, setReplacement] = useState("");
  const [computed, setComputed] = useState<{ id: number; result: RegexResult } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const [currentId, setCurrentId] = useState(0);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    if (!pattern) return;
    const id = ++requestId.current;
    setCurrentId(id);
    const input: RegexInput = {
      pattern,
      flags: normalizeFlags(flags),
      text,
      replacement: useReplace ? replacement : undefined,
    };
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("./regex.worker.ts", import.meta.url));
    }
    const worker = workerRef.current;
    const timer = setTimeout(() => {
      // 止まらない照合は Worker ごと捨て、次の入力では作り直す
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      setComputed({ id, result: { error: TIMEOUT_ERROR } });
    }, TIMEOUT_MS);
    const onMessage = (event: MessageEvent<{ id: number; result: RegexResult }>) => {
      if (event.data.id !== id) return;
      clearTimeout(timer);
      setComputed(event.data);
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage({ id, input } satisfies RegexRequest);
    return () => {
      clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
    };
  }, [pattern, flags, text, useReplace, replacement]);

  // 今の入力に対する結果だけを表示する(入力を変えたら古い結果やエラーは出さない)
  const result = pattern && computed?.id === currentId ? computed.result : null;

  return (
    <ToolPage
      title={name}
      guide={toolGuides["/regex"]}
      description={`${description}。JavaScript(ECMAScript)の正規表現で、照合はブラウザの中で行い、入力は送信されません。`}
    >
      <Stack spacing={2}>
        <TextField
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="正規表現のパターン(例: (?<year>\d{4})-(\d{2}))"
          slotProps={{
            htmlInput: { "aria-label": "正規表現のパターン", spellCheck: false },
            input: {
              startAdornment: <Typography sx={{ color: "text.secondary", mr: 0.5 }}>/</Typography>,
              endAdornment: (
                <Typography sx={{ color: "text.secondary", ml: 0.5, fontFamily: "var(--font-mono)" }}>
                  /{normalizeFlags(flags)}
                </Typography>
              ),
            },
          }}
          sx={monoInput}
        />
        <ToggleButtonGroup
          size="small"
          color="primary"
          value={flags}
          onChange={(_, value: string[]) => setFlags((prev) => toggleFlags(prev, value))}
          aria-label="フラグ"
          sx={{ flexWrap: "wrap" }}
        >
          {REGEX_FLAGS.map(({ flag, label }) => (
            <ToggleButton key={flag} value={flag} aria-label={label} title={label} sx={{ px: 1.5 }}>
              <Box component="span" sx={{ fontFamily: "var(--font-mono)" }}>
                {flag}
              </Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TextField
          multiline
          minRows={6}
          maxRows={20}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="テスト文字列を入力"
          slotProps={{ htmlInput: { "aria-label": "テスト文字列", spellCheck: false } }}
          sx={monoInput}
        />
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={useReplace}
              onChange={(e) => setUseReplace(e.target.checked)}
            />
          }
          label="置換する"
        />
        {useReplace && (
          <TextField
            size="small"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            autoFocus
            placeholder="置換文字列($1 や $<name> でグループを参照)"
            slotProps={{ htmlInput: { "aria-label": "置換文字列", spellCheck: false } }}
            sx={monoInput}
          />
        )}
        {result?.error !== undefined && <Alert severity="error">{result.error}</Alert>}
        {result && result.error === undefined && (
          <>
            <Highlighted text={text} matches={result.matches} truncated={result.truncated} />
            {result.replaced !== undefined && (
              <CodeBlock title="置換結果" text={result.replaced} copyLabel="置換結果をコピー" />
            )}
            {result.matches.length > 0 && <MatchList matches={result.matches} />}
          </>
        )}
      </Stack>
    </ToolPage>
  );
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="h2" sx={{ fontSize: "1rem" }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Highlighted({
  text,
  matches,
  truncated,
}: {
  text: string;
  matches: RegexMatch[];
  truncated: boolean;
}) {
  const segments = splitByMatches(text, matches);
  return (
    <Paper component="section" variant="outlined" sx={{ overflow: "hidden" }} aria-label="一致した箇所">
      <SectionHeader title="一致した箇所">
        <Typography variant="body2" role="status" sx={{ color: "text.secondary" }}>
          {matches.length === 0
            ? "一致なし"
            : truncated
              ? `${MAX_MATCHES} 件以上一致(最初の ${MAX_MATCHES} 件を表示)`
              : `${matches.length} 件一致`}
        </Typography>
      </SectionHeader>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          maxHeight: 400,
          overflow: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "0.875rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {segments.map((s, i) =>
          s.match === undefined ? (
            s.text
          ) : (
            <Box
              key={i}
              component="mark"
              title={`一致 ${s.match + 1}`}
              sx={(theme) => ({
                color: "inherit",
                borderRadius: 0.5,
                // 隣り合う一致を見分けられるよう、交互に濃さを変える
                bgcolor: theme.alpha(
                  (theme.vars ?? theme).palette.primary.main,
                  s.match! % 2 === 0 ? 0.25 : 0.45
                ),
              })}
            >
              {s.text}
            </Box>
          )
        )}
      </Box>
    </Paper>
  );
}

const showValue = (value: string | undefined) =>
  value === undefined ? "(一致なし)" : JSON.stringify(value);

function MatchList({ matches }: { matches: RegexMatch[] }) {
  return (
    <Paper component="section" variant="outlined" sx={{ overflow: "hidden" }} aria-label="一致の一覧">
      <SectionHeader title="一致の一覧" />
      <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none", maxHeight: 600, overflow: "auto" }}>
        {matches.map((m, i) => (
          <Box
            component="li"
            key={i}
            sx={{
              px: 2,
              py: 1,
              borderTop: i === 0 ? 0 : 1,
              borderColor: "divider",
              fontFamily: "var(--font-mono)",
              fontSize: "0.875rem",
              wordBreak: "break-all",
            }}
          >
            <Typography component="div" variant="body2" sx={{ color: "text.secondary" }}>
              {`#${i + 1} 位置 ${m.index}〜${m.end}`}
            </Typography>
            <div>{JSON.stringify(m.text)}</div>
            {m.groups.length > 0 && (
              <Box component="dl" sx={{ m: 0, mt: 0.5, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2 }}>
                {m.groups.map((g) => (
                  <Box key={g.label} sx={{ display: "contents" }}>
                    <Box component="dt" sx={{ color: "text.secondary" }}>
                      {`グループ ${g.label}`}
                    </Box>
                    <Box component="dd" sx={{ m: 0 }}>
                      {showValue(g.value)}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
