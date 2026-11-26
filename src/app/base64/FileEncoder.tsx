"use client";
import { useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CodeBlock from "../CodeBlock";
import { encodeBase64Bytes, toDataUrl } from "./base64";

// これより大きいファイルは、結果の文字列が大きすぎて画面が重くなるので扱わない
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Encoded =
  | { name: string; size: number; type: string; base64: string; dataUrl: string }
  | { name: string; error: string };

// ファイルを選ぶ(またはドロップする)と、中身を Base64 と data URL にする。ファイルは送信しない
export default function FileEncoder({ urlSafe }: { urlSafe: boolean }) {
  const [encoded, setEncoded] = useState<Encoded | null>(null);
  const [dragging, setDragging] = useState(false);
  // 読み込み中に別のファイルが選ばれたら、古いほうの結果で上書きしない
  const latest = useRef<File | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    latest.current = file;
    if (file.size > MAX_FILE_SIZE) {
      setEncoded({ name: file.name, error: "10MBより大きいファイルは扱えません" });
      return;
    }
    setEncoded(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (latest.current !== file) return;
      setEncoded({
        name: file.name,
        size: file.size,
        type: file.type,
        base64: encodeBase64Bytes(bytes),
        dataUrl: toDataUrl(bytes, file.type),
      });
    } catch {
      if (latest.current === file) {
        setEncoded({ name: file.name, error: "ファイルを読み込めませんでした" });
      }
    }
  };

  const base64 =
    encoded && "base64" in encoded
      ? urlSafe
        ? encoded.base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
        : encoded.base64
      : "";

  return (
    <Stack spacing={2}>
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
        sx={{
          p: 2,
          border: 2,
          borderStyle: "dashed",
          borderColor: dragging ? "primary.main" : "divider",
          borderRadius: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
          ファイルを選択
          <input
            type="file"
            hidden
            aria-label="Base64にするファイル"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              // 同じファイルを選び直しても onChange が起きるように空にする
              e.target.value = "";
            }}
          />
        </Button>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          画像などのファイルを Base64 や data URL にします(ここにドロップもできます)
        </Typography>
      </Box>
      {encoded && "error" in encoded && (
        <Alert severity="error">
          {encoded.name}: {encoded.error}
        </Alert>
      )}
      {encoded && "base64" in encoded && (
        <>
          <Typography variant="body2">
            {encoded.name}({encoded.size.toLocaleString()} バイト
            {encoded.type ? `、${encoded.type}` : ""})
          </Typography>
          <CodeBlock title="ファイルのBase64" text={base64} copyLabel="ファイルのBase64をコピー" />
          <CodeBlock
            title="data URL"
            text={encoded.dataUrl}
            copyLabel="data URLをコピー"
          />
        </>
      )}
    </Stack>
  );
}
