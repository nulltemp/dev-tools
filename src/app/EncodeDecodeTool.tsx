"use client";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import CodeBlock from "./CodeBlock";
import { monoInput } from "./inputStyles";

// 変換できないときの error は Alert で出す。severity: "info" と details で、
// エラーではない別の表示(Base64 のバイナリのデコード結果など)にもできる
export type ConvertResult =
  | { ok: true; text: string }
  | { ok: false; error: string; severity?: "error" | "info"; details?: React.ReactNode };

type Mode = "encode" | "decode";

const MODE_LABELS: Record<Mode, string> = { encode: "エンコード", decode: "デコード" };

// Base64・URLエンコードのように、テキストを「エンコード」「デコード」する双方向の変換ツール。
// 入力のたびに変換するので、入力と食い違った古い結果は残らない
export default function EncodeDecodeTool({
  encode,
  decode,
  option,
  placeholders,
  children,
}: {
  encode: (text: string, optionChecked: boolean) => ConvertResult;
  decode: (text: string, optionChecked: boolean) => ConvertResult;
  // 変換の細かい違いを切り替えるチェックボックス(例: URLセーフ)
  option: { label: string; appliesTo: Mode[] };
  placeholders: Record<Mode, string>;
  // モードごとに結果の下に添える部品(Base64 のファイル選択など)
  children?: (mode: Mode, optionChecked: boolean) => React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [optionChecked, setOptionChecked] = useState(false);

  const result = input ? (mode === "encode" ? encode : decode)(input, optionChecked) : null;

  // 結果を入力に移して逆方向に変換し直す(往復の確認や、続けて変換したいとき用)
  const handleSwap = () => {
    if (!result?.ok) return;
    setInput(result.text);
    setMode(mode === "encode" ? "decode" : "encode");
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1, sm: 2 }}
        sx={{ alignItems: { sm: "center" } }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          color="primary"
          value={mode}
          // 選択中のボタンをもう一度押すと null になるので、そのときは変えない
          onChange={(_, value: Mode | null) => value && setMode(value)}
          aria-label="変換の向き"
          sx={{ alignSelf: "flex-start" }}
        >
          <ToggleButton value="encode" sx={{ px: 2 }}>
            {MODE_LABELS.encode}
          </ToggleButton>
          <ToggleButton value="decode" sx={{ px: 2 }}>
            {MODE_LABELS.decode}
          </ToggleButton>
        </ToggleButtonGroup>
        {option.appliesTo.includes(mode) && (
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={optionChecked}
                onChange={(e) => setOptionChecked(e.target.checked)}
              />
            }
            label={option.label}
          />
        )}
      </Stack>
      <TextField
        multiline
        minRows={6}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholders[mode]}
        slotProps={{ htmlInput: { "aria-label": `${MODE_LABELS[mode]}するテキスト` } }}
        sx={monoInput}
      />
      {result && !result.ok && (
        <>
          <Alert severity={result.severity ?? "error"}>{result.error}</Alert>
          {result.details}
        </>
      )}
      {result?.ok && (
        <>
          <CodeBlock
            title={`${MODE_LABELS[mode]}結果`}
            text={result.text}
            copyLabel={`${MODE_LABELS[mode]}結果をコピー`}
          />
          <Button
            variant="outlined"
            startIcon={<SwapVertIcon />}
            onClick={handleSwap}
            sx={{ alignSelf: "flex-start" }}
          >
            結果を入力にして{MODE_LABELS[mode === "encode" ? "decode" : "encode"]}
          </Button>
        </>
      )}
      {children?.(mode, optionChecked)}
    </Stack>
  );
}
