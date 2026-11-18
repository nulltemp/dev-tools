"use client";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import CodeBlock from "../CodeBlock";
import ToolPage from "../ToolPage";
import { monoInput } from "../inputStyles";
import { findTool } from "../tools";
import { formatJson } from "./formatJson";

const { name, description } = findTool("/json-formatter");

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [formatted, setFormatted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormat = () => {
    const result = formatJson(input);
    setFormatted(result.ok ? result.formatted : null);
    setError(result.ok ? null : result.error);
  };

  // 入力と食い違った古い結果やエラーを表示し続けないよう、入力が変わったら消す
  const handleInputChange = (value: string) => {
    setInput(value);
    setFormatted(null);
    setError(null);
  };

  return (
    <ToolPage title={name} description={description}>
      <Stack spacing={2}>
        <TextField
          multiline
          minRows={10}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="ここにJSONを入力してください"
          slotProps={{ htmlInput: { "aria-label": "整形するJSON" } }}
          sx={monoInput}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={handleFormat}>
            整形
          </Button>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {formatted && (
          <CodeBlock title="整形結果" text={formatted} copyLabel="整形結果をコピー" />
        )}
      </Stack>
    </ToolPage>
  );
}
