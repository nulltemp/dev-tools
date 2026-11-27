"use client";
import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CodeBlock from "../CodeBlock";
import ToolPage from "../ToolPage";
import { monoInput } from "../inputStyles";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import FilePicker from "./FilePicker";
import {
  findMatchingAlgorithm,
  formatDigest,
  HASH_ALGORITHMS,
  hashAll,
  hashErrorMessage,
  type DigestFormat,
  type HashAlgorithm,
  type HashInput,
} from "./hash";

const { name, description } = findTool("/hash");

const FORMAT_LABELS: Record<DigestFormat, string> = {
  hex: "16進(小文字)",
  HEX: "16進(大文字)",
  base64: "Base64",
};

type Source = "text" | "file";

// これより大きいファイルはメモリに読み込むと重すぎるので扱わない
const MAX_FILE_SIZE = 200 * 1024 * 1024;

type LoadedFile =
  | { name: string; size: number; bytes: Uint8Array<ArrayBuffer> }
  | { name: string; error: string };

interface Computed {
  data: HashInput;
  key: string | undefined;
  digests?: Record<HashAlgorithm, Uint8Array>;
  error?: string;
}

export default function HashPage() {
  const [source, setSource] = useState<Source>("text");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [expected, setExpected] = useState("");
  // 読み込み中に別のファイルが選ばれたら、古いほうの結果で上書きしない
  const latestFile = useRef<File | null>(null);
  const [useHmac, setUseHmac] = useState(false);
  const [hmacKey, setHmacKey] = useState("");
  const [format, setFormat] = useState<DigestFormat>("hex");
  const [computed, setComputed] = useState<Computed | null>(null);

  const key = useHmac ? hmacKey : undefined;
  // Web Crypto は長さ0の HMAC 鍵を受け付けないので、鍵が入力されるまで計算しない
  const needsKey = key === "";
  // ハッシュする入力。テキストは空なら計算しない(空のファイルは計算する)
  const data: HashInput | null =
    source === "text" ? input || null : file && "bytes" in file ? file.bytes : null;

  useEffect(() => {
    if (data === null || needsKey) return;
    // 計算中に入力が変わったら、古い結果で上書きしない
    let cancelled = false;
    hashAll(data, key).then(
      (digests) => !cancelled && setComputed({ data, key, digests }),
      (error: unknown) => !cancelled && setComputed({ data, key, error: hashErrorMessage(error) })
    );
    return () => {
      cancelled = true;
    };
  }, [data, key, needsKey]);

  // 今の入力に対して計算した結果だけを表示する(入力を変えたら古い結果は出さない)
  const current =
    data !== null && !needsKey && computed?.data === data && computed.key === key ? computed : null;
  const matched =
    current?.digests && expected.trim()
      ? (findMatchingAlgorithm(expected, current.digests) ?? null)
      : undefined;

  // File.arrayBuffer() でブラウザの中だけで読み込む。ファイルは送信しない
  const handleFile = async (picked: File) => {
    latestFile.current = picked;
    if (picked.size > MAX_FILE_SIZE) {
      setFile({ name: picked.name, error: "200MBより大きいファイルは扱えません" });
      return;
    }
    setFile(null);
    try {
      const bytes = new Uint8Array(await picked.arrayBuffer());
      if (latestFile.current !== picked) return;
      setFile({ name: picked.name, size: picked.size, bytes });
    } catch {
      if (latestFile.current === picked) {
        setFile({ name: picked.name, error: "ファイルを読み込めませんでした" });
      }
    }
  };

  return (
    <ToolPage
      title={name}
      guide={toolGuides["/hash"]}
      description={`${description}。テキストは UTF-8 としてハッシュします。ブラウザの Web Crypto で計算し、入力やファイルは送信されません(MD5 は Web Crypto にないため対応していません)。`}
    >
      <Stack spacing={2}>
        <ToggleButtonGroup
          size="small"
          exclusive
          color="primary"
          value={source}
          onChange={(_, value: Source | null) => value && setSource(value)}
          aria-label="入力の種類"
          sx={{ alignSelf: "flex-start" }}
        >
          <ToggleButton value="text" sx={{ px: 1.5 }}>
            テキスト
          </ToggleButton>
          <ToggleButton value="file" sx={{ px: 1.5 }}>
            ファイル
          </ToggleButton>
        </ToggleButtonGroup>
        {source === "file" && <FilePicker onFile={(f) => void handleFile(f)} />}
        {source === "file" && file && "error" in file && (
          <Alert severity="error">
            {file.name}: {file.error}
          </Alert>
        )}
        {source === "file" && file && "bytes" in file && (
          <Typography variant="body2">
            {file.name}({file.size.toLocaleString()} バイト)
          </Typography>
        )}
        {source === "text" && (
          <TextField
            multiline
            minRows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ハッシュを計算するテキストを入力"
            slotProps={{ htmlInput: { "aria-label": "ハッシュを計算するテキスト" } }}
            sx={monoInput}
          />
        )}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1, sm: 2 }}
          sx={{ alignItems: { sm: "center" } }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            color="primary"
            value={format}
            onChange={(_, value: DigestFormat | null) => value && setFormat(value)}
            aria-label="出力形式"
            sx={{ alignSelf: "flex-start" }}
          >
            {(Object.keys(FORMAT_LABELS) as DigestFormat[]).map((f) => (
              <ToggleButton key={f} value={f} sx={{ px: 1.5 }}>
                {FORMAT_LABELS[f]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={useHmac}
                onChange={(e) => setUseHmac(e.target.checked)}
              />
            }
            label="HMAC"
          />
        </Stack>
        {useHmac && (
          <TextField
            size="small"
            value={hmacKey}
            onChange={(e) => setHmacKey(e.target.value)}
            // チェックを入れたらそのまま鍵を入力できるようにする
            autoFocus
            placeholder="秘密鍵(UTF-8 のテキストとして使います)"
            slotProps={{ htmlInput: { "aria-label": "HMACの秘密鍵" } }}
            sx={monoInput}
          />
        )}
        {needsKey && data !== null && (
          <Alert severity="info">HMAC を計算するには秘密鍵を入力してください。</Alert>
        )}
        {current?.error && <Alert severity="error">{current.error}</Alert>}
        {current?.digests &&
          HASH_ALGORITHMS.map((algorithm) => {
            const title = useHmac ? `HMAC-${algorithm}` : algorithm;
            return (
              <CodeBlock
                key={algorithm}
                title={title}
                text={formatDigest(current.digests![algorithm], format)}
                copyLabel={`${title}をコピー`}
              />
            );
          })}
        <TextField
          size="small"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="照合する値(配布元のハッシュ値などを貼り付け)"
          slotProps={{ htmlInput: { "aria-label": "照合する値" } }}
          sx={monoInput}
        />
        {matched && (
          <Alert severity="success">
            {useHmac ? `HMAC-${matched}` : matched} の値と一致しました。
          </Alert>
        )}
        {matched === null && (
          <Alert severity="warning">どのアルゴリズムの値とも一致しません。</Alert>
        )}
      </Stack>
    </ToolPage>
  );
}
