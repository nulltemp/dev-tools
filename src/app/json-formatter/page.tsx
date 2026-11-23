"use client";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import CodeBlock from "../CodeBlock";
import ToolPage from "../ToolPage";
import { monoInput } from "../inputStyles";
import { findTool } from "../tools";
import { formatJson, minifyJson, type FormatJsonResult, type IndentKey } from "./formatJson";

const { name, description } = findTool("/json-formatter");

const INDENT_OPTIONS: { value: IndentKey; label: string }[] = [
  { value: "2", label: "2スペース" },
  { value: "4", label: "4スペース" },
  { value: "tab", label: "タブ" },
];

type Result = { title: string; copyLabel: string; text: string };

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<IndentKey>("2");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const show = (outcome: FormatJsonResult, title: string) => {
    setResult(
      outcome.ok ? { title, copyLabel: `${title}をコピー`, text: outcome.formatted } : null,
    );
    setError(outcome.ok ? null : outcome.error);
  };

  const handleFormat = (value: IndentKey = indent) => show(formatJson(input, value), "整形結果");
  const handleMinify = () => show(minifyJson(input), "圧縮結果");

  // 入力と食い違った古い結果やエラーを表示し続けないよう、入力が変わったら消す
  const handleInputChange = (value: string) => {
    setInput(value);
    setResult(null);
    setError(null);
  };

  // 整形結果を表示中なら、選び直したインデント幅で整形し直す
  const handleIndentChange = (value: IndentKey | null) => {
    if (value === null) return;
    setIndent(value);
    if (result?.title === "整形結果") handleFormat(value);
  };

  return (
    <ToolPage title={name} description={description}>
      <Stack spacing={2}>
        <TextField
          multiline
          minRows={10}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleFormat();
            }
          }}
          placeholder="ここにJSONを入力してください"
          slotProps={{ htmlInput: { "aria-label": "整形するJSON" } }}
          sx={monoInput}
        />
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            color="primary"
            value={indent}
            onChange={(_, value: IndentKey | null) => handleIndentChange(value)}
            aria-label="インデント幅"
          >
            {INDENT_OPTIONS.map(({ value, label }) => (
              <ToggleButton key={value} value={value} sx={{ px: 1.5 }}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Ctrl+Enter で整形
            </Typography>
            <Button variant="outlined" onClick={handleMinify}>
              圧縮
            </Button>
            <Button variant="contained" onClick={() => handleFormat()}>
              整形
            </Button>
          </Box>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {result && (
          <CodeBlock title={result.title} text={result.text} copyLabel={result.copyLabel} />
        )}
      </Stack>
    </ToolPage>
  );
}
