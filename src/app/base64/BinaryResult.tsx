"use client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DownloadIcon from "@mui/icons-material/Download";
import CodeBlock from "../CodeBlock";
import { downloadFileName, hexDump, isPreviewableImage, toDataUrl } from "./base64";

const HEX_DUMP_LIMIT = 256;

// テキストとして読めないデコード結果(画像などのバイナリ)の表示。
// バイト数と先頭の16進ダンプ、画像ならプレビュー、ファイルとしての保存を出す
export default function BinaryResult({ bytes, mimeType }: { bytes: Uint8Array; mimeType?: string }) {
  const fileName = downloadFileName(mimeType);

  // Blob の URL はクリックしたときにだけ作り、保存が始まったら破棄する
  // (<a href="blob:..."> への遷移は CSP の img-src / connect-src の対象外)
  const handleDownload = () => {
    const url = URL.createObjectURL(
      new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mimeType || "application/octet-stream" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2">
        {bytes.length.toLocaleString()} バイト
        {mimeType ? `(${mimeType})` : ""}
      </Typography>
      {isPreviewableImage(mimeType) && (
        <Box
          component="img"
          // img-src は data: を許可している
          src={toDataUrl(bytes, mimeType!)}
          alt="デコードした画像のプレビュー"
          sx={{
            maxWidth: "100%",
            maxHeight: 360,
            alignSelf: "flex-start",
            border: 1,
            borderColor: "divider",
          }}
        />
      )}
      <CodeBlock
        title={
          bytes.length > HEX_DUMP_LIMIT
            ? `16進ダンプ(先頭${HEX_DUMP_LIMIT}バイト)`
            : "16進ダンプ"
        }
        text={hexDump(bytes, HEX_DUMP_LIMIT)}
        copyLabel="16進ダンプをコピー"
      />
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleDownload}
        sx={{ alignSelf: "flex-start" }}
      >
        ファイルとして保存({fileName})
      </Button>
    </Stack>
  );
}
