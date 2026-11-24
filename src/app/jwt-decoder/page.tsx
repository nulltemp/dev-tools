"use client";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CodeBlock from "../CodeBlock";
import ToolPage from "../ToolPage";
import { monoInput } from "../inputStyles";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import { decodeJwt, type DecodedJwt } from "./decodeJwt";

const { name, description } = findTool("/jwt-decoder");

interface TimeNote {
  label: string;
  text: string;
  alert: boolean;
}

interface DecodedView {
  header: string;
  payload: string;
  signature: string;
  timeNotes: TimeNote[];
}

const formatDate = (date: Date) => date.toLocaleString("ja-JP");

const toTimeNotes = (decoded: DecodedJwt): TimeNote[] => {
  const notes: TimeNote[] = [];
  if (decoded.issuedAt) {
    notes.push({
      label: "発行日時(iat)",
      text: formatDate(decoded.issuedAt),
      alert: false,
    });
  }
  if (decoded.notBefore) {
    notes.push({
      label: "有効開始(nbf)",
      text: `${formatDate(decoded.notBefore)}${
        decoded.isNotYetValid ? "(まだ有効ではありません)" : ""
      }`,
      alert: decoded.isNotYetValid,
    });
  }
  if (decoded.expiresAt) {
    notes.push({
      label: "有効期限(exp)",
      text: `${formatDate(decoded.expiresAt)}${
        decoded.isExpired ? "(期限切れ)" : ""
      }`,
      alert: decoded.isExpired,
    });
  }
  return notes;
};

export default function JwtDecoderPage() {
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = () => {
    const result = decodeJwt(input);
    if (!result.ok) {
      setDecoded(null);
      setError(result.error);
      return;
    }

    const { header, payload, signature } = result.decoded;
    setDecoded({
      header,
      payload,
      signature,
      timeNotes: toTimeNotes(result.decoded),
    });
    setError(null);
  };

  // 入力と食い違った古い結果やエラーを表示し続けないよう、入力が変わったら消す
  const handleInputChange = (value: string) => {
    setInput(value);
    setDecoded(null);
    setError(null);
  };

  return (
    <ToolPage title={name} description={description} guide={toolGuides["/jwt-decoder"]}>
      <Stack spacing={2}>
        <Alert severity="info" variant="outlined">
          入力したJWTはブラウザ内でデコードされ、どこにも送信されません。
          {"「Bearer 」付きのまま貼り付けても読み取れます。"}
        </Alert>
        <TextField
          multiline
          minRows={6}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="ここにJWTを入力してください"
          slotProps={{ htmlInput: { "aria-label": "デコードするJWT" } }}
          sx={monoInput}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={handleDecode}>
            デコード
          </Button>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {decoded && (
          <>
            <CodeBlock title="ヘッダー" text={decoded.header} copyLabel="ヘッダーをコピー" />
            <CodeBlock
              title="ペイロード"
              text={decoded.payload}
              copyLabel="ペイロードをコピー"
            >
              {decoded.timeNotes.length > 0 &&
                decoded.timeNotes.map((note) => (
                  <Typography
                    key={note.label}
                    variant="body2"
                    sx={{
                      color: note.alert ? "error.main" : "text.secondary",
                      fontWeight: note.alert ? 700 : undefined,
                    }}
                  >
                    {note.label}: {note.text}
                  </Typography>
                ))}
            </CodeBlock>
            <CodeBlock title="署名" text={decoded.signature} copyLabel="署名をコピー">
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                ※署名の検証は行っていません(デコードのみ)
              </Typography>
            </CodeBlock>
          </>
        )}
      </Stack>
    </ToolPage>
  );
}
