"use client";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ToolPage from "../ToolPage";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import {
  countGraphemes,
  countGraphemesWithoutWhitespace,
  countLines,
  countUtf8Bytes,
} from "./countChars";

const { name, description } = findTool("/char-count");

export default function CharCounterPage() {
  const [text, setText] = useState("");
  const stats = useMemo(
    () => [
      { label: "文字数", value: countGraphemes(text) },
      { label: "空白・改行を除いた文字数", value: countGraphemesWithoutWhitespace(text) },
      { label: "行数", value: countLines(text) },
      { label: "バイト数（UTF-8）", value: countUtf8Bytes(text) },
    ],
    [text],
  );

  return (
    <ToolPage title={name} description={description} guide={toolGuides["/char-count"]}>
      <Stack spacing={2}>
        <TextField
          multiline
          minRows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="文字を入力してください"
          slotProps={{ htmlInput: { "aria-label": "文字数を数えるテキスト" } }}
        />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {stats.map(({ label, value }) => (
            <Paper key={label} variant="outlined" sx={{ px: 2.5, py: 1.5 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {label}
              </Typography>
              <Typography
                component="p"
                sx={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.3 }}
              >
                {value.toLocaleString("ja-JP")}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Stack>
    </ToolPage>
  );
}
