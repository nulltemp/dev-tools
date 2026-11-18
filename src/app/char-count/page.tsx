"use client";
import { useMemo, useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ToolPage from "../ToolPage";
import { findTool } from "../tools";
import { countGraphemes } from "./countChars";

const { name, description } = findTool("/char-count");

export default function CharCounterPage() {
  const [text, setText] = useState("");
  const charCount = useMemo(() => countGraphemes(text), [text]);

  return (
    <ToolPage title={name} description={description}>
      <Stack spacing={2}>
        <TextField
          multiline
          minRows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="文字を入力してください"
          slotProps={{ htmlInput: { "aria-label": "文字数を数えるテキスト" } }}
        />
        <Paper variant="outlined" sx={{ px: 2.5, py: 1.5, alignSelf: "flex-start" }}>
          <Typography variant="body2" color="text.secondary">
            文字数
          </Typography>
          <Typography
            component="p"
            sx={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.3 }}
          >
            {charCount.toLocaleString("ja-JP")}
          </Typography>
        </Paper>
      </Stack>
    </ToolPage>
  );
}
