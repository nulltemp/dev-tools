"use client";
import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CodeBlock from "../CodeBlock";
import ToolPage from "../ToolPage";
import { monoInput } from "../inputStyles";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import {
  formatDigest,
  HASH_ALGORITHMS,
  hashAll,
  type DigestFormat,
  type HashAlgorithm,
} from "./hash";

const { name, description } = findTool("/hash");

const FORMAT_LABELS: Record<DigestFormat, string> = {
  hex: "16進(小文字)",
  HEX: "16進(大文字)",
  base64: "Base64",
};

interface Computed {
  text: string;
  key: string | undefined;
  digests?: Record<HashAlgorithm, Uint8Array>;
  error?: string;
}

export default function HashPage() {
  const [input, setInput] = useState("");
  const [useHmac, setUseHmac] = useState(false);
  const [hmacKey, setHmacKey] = useState("");
  const [format, setFormat] = useState<DigestFormat>("hex");
  const [computed, setComputed] = useState<Computed | null>(null);

  const key = useHmac ? hmacKey : undefined;

  useEffect(() => {
    if (!input) return;
    // 計算中に入力が変わったら、古い結果で上書きしない
    let cancelled = false;
    hashAll(input, key).then(
      (digests) => !cancelled && setComputed({ text: input, key, digests }),
      () =>
        !cancelled &&
        setComputed({
          text: input,
          key,
          error: "ハッシュを計算できませんでした。ブラウザが Web Crypto に対応していない可能性があります。",
        })
    );
    return () => {
      cancelled = true;
    };
  }, [input, key]);

  // 今の入力に対して計算した結果だけを表示する(入力を変えたら古い結果は出さない)
  const current = input && computed?.text === input && computed.key === key ? computed : null;

  return (
    <ToolPage
      title={name}
      guide={toolGuides["/hash"]}
      description={`${description}。テキストは UTF-8 としてハッシュします。ブラウザの Web Crypto で計算し、入力は送信されません(MD5 は Web Crypto にないため対応していません)。`}
    >
      <Stack spacing={2}>
        <TextField
          multiline
          minRows={6}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ハッシュを計算するテキストを入力"
          slotProps={{ htmlInput: { "aria-label": "ハッシュを計算するテキスト" } }}
          sx={monoInput}
        />
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
            placeholder="秘密鍵(UTF-8 のテキストとして使います)"
            slotProps={{ htmlInput: { "aria-label": "HMACの秘密鍵" } }}
            sx={monoInput}
          />
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
      </Stack>
    </ToolPage>
  );
}
