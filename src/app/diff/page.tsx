"use client";
import { useDeferredValue, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import CopyButton from "../CopyButton";
import ToolPage from "../ToolPage";
import { monoInput } from "../inputStyles";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import { diffLines, DiffTooLargeError, formatUnified, type DiffLine, type DiffResult } from "./diff";

const { name, description } = findTool("/diff");

const SIGNS = { equal: "", delete: "-", insert: "+" } as const;

// 追加は success、削除は error の色を薄く敷く(記号 +/- も出すので色だけに頼らない)
const lineColor = (type: DiffLine["type"]) => (type === "insert" ? "success" : "error");
const tint = (theme: Theme, type: DiffLine["type"], amount: number) =>
  theme.alpha((theme.vars ?? theme).palette[lineColor(type)].main, amount);

type Computed = { result: DiffResult; error?: undefined } | { result?: undefined; error: string };

export default function DiffPage() {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  // 大きなテキストでも入力が引っかからないよう、差分の計算は入力より遅れてよいことにする
  const deferredBefore = useDeferredValue(before);
  const deferredAfter = useDeferredValue(after);

  const computed = useMemo((): Computed | null => {
    if (!deferredBefore && !deferredAfter) return null;
    try {
      return {
        result: diffLines(deferredBefore, deferredAfter, { ignoreWhitespace, ignoreCase }),
      };
    } catch (error) {
      if (error instanceof DiffTooLargeError) return { error: error.message };
      throw error;
    }
  }, [deferredBefore, deferredAfter, ignoreWhitespace, ignoreCase]);

  const result = computed?.result;
  const hasChanges = result && result.added + result.removed > 0;

  return (
    <ToolPage
      title={name}
      guide={toolGuides["/diff"]}
      description={`${description}。比較はブラウザの中で行い、入力は送信されません。`}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            multiline
            minRows={8}
            maxRows={20}
            fullWidth
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            placeholder="変更前のテキスト"
            slotProps={{ htmlInput: { "aria-label": "変更前のテキスト" } }}
            sx={monoInput}
          />
          <TextField
            multiline
            minRows={8}
            maxRows={20}
            fullWidth
            value={after}
            onChange={(e) => setAfter(e.target.value)}
            placeholder="変更後のテキスト"
            slotProps={{ htmlInput: { "aria-label": "変更後のテキスト" } }}
            sx={monoInput}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0, sm: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              />
            }
            label="空白の違いを無視"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={ignoreCase}
                onChange={(e) => setIgnoreCase(e.target.checked)}
              />
            }
            label="大文字・小文字を無視"
          />
        </Stack>
        {computed?.error && <Alert severity="error">{computed.error}</Alert>}
        {result && !hasChanges && <Alert severity="info">差分はありません。</Alert>}
        {result?.approximate && (
          <Alert severity="warning">
            違いが大きいため、途中で計算を打ち切りました。最小の差分になっていない部分があります。
          </Alert>
        )}
        {result && hasChanges && <DiffView result={result} />}
      </Stack>
    </ToolPage>
  );
}

function DiffView({ result }: { result: DiffResult }) {
  const unified = useMemo(
    () => formatUnified(result.lines, 3, { before: "変更前", after: "変更後" }),
    [result]
  );
  return (
    <Paper component="section" variant="outlined" sx={{ overflow: "hidden" }}>
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
          差分
        </Typography>
        <Typography variant="body2" role="status" sx={{ color: "text.secondary" }}>
          {`追加 ${result.added} 行・削除 ${result.removed} 行`}
        </Typography>
        <Box sx={{ ml: "auto" }}>
          <CopyButton text={unified} label="unified diff 形式でコピー" />
        </Box>
      </Box>
      <Box sx={{ maxHeight: 600, overflow: "auto" }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-mono)",
            fontSize: "0.875rem",
            lineHeight: 1.6,
          }}
        >
          <Box component="thead" sx={visuallyHidden}>
            <tr>
              <th scope="col">変更前の行</th>
              <th scope="col">変更後の行</th>
              <th scope="col">種類</th>
              <th scope="col">内容</th>
            </tr>
          </Box>
          <tbody>
            {result.lines.map((line, index) => (
              <Row key={index} line={line} />
            ))}
          </tbody>
        </Box>
      </Box>
    </Paper>
  );
}

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

const numberCell = {
  px: 1,
  textAlign: "right",
  verticalAlign: "top",
  color: "text.secondary",
  userSelect: "none",
  whiteSpace: "nowrap",
  width: "1%",
} as const;

function Row({ line }: { line: DiffLine }) {
  const changed = line.type !== "equal";
  return (
    <Box
      component="tr"
      data-type={line.type}
      sx={changed ? (theme) => ({ bgcolor: tint(theme, line.type, 0.12) }) : undefined}
    >
      <Box component="td" sx={numberCell}>
        {line.oldNo}
      </Box>
      <Box component="td" sx={numberCell}>
        {line.newNo}
      </Box>
      <Box
        component="td"
        sx={{ px: 0.5, verticalAlign: "top", userSelect: "none", width: "1%" }}
      >
        {SIGNS[line.type]}
      </Box>
      <Box
        component="td"
        sx={{ pr: 2, height: "1.6em", whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-all" }}
      >
        {line.segments
          ? line.segments.map((segment, i) =>
              segment.changed ? (
                <Box
                  key={i}
                  component="mark"
                  sx={(theme) => ({
                    bgcolor: tint(theme, line.type, 0.35),
                    color: "inherit",
                    borderRadius: 0.5,
                  })}
                >
                  {segment.text}
                </Box>
              ) : (
                segment.text
              )
            )
          : line.text}
      </Box>
    </Box>
  );
}
