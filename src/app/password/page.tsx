"use client";
import { useState } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CodeBlock from "../CodeBlock";
import ToolPage from "../ToolPage";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import {
  CHAR_KINDS,
  type CharKind,
  clampInt,
  entropyBits,
  generatePasswords,
  MAX_COUNT,
  MAX_LENGTH,
  MIN_LENGTH,
  type PasswordOptions,
} from "./password";

const { name, description } = findTool("/password");

const DEFAULT_LENGTH = 16;

const KIND_LABELS: Record<CharKind, string> = {
  upper: "英大文字(A-Z)",
  lower: "英小文字(a-z)",
  digits: "数字(0-9)",
  symbols: "記号(!#$%など)",
};

export default function PasswordPage() {
  const [lengthInput, setLengthInput] = useState(String(DEFAULT_LENGTH));
  const [countInput, setCountInput] = useState("5");
  const [kinds, setKinds] = useState<CharKind[]>(["upper", "lower", "digits", "symbols"]);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [requireEach, setRequireEach] = useState(true);
  const [passwords, setPasswords] = useState<string[]>([]);

  const length = clampInt(lengthInput, MIN_LENGTH, MAX_LENGTH, DEFAULT_LENGTH);
  const options: PasswordOptions = { length, kinds, excludeAmbiguous, requireEach };
  const bits = entropyBits(options);

  // 条件を変えたら、古い条件で作った結果は消す
  const update = (apply: () => void) => {
    apply();
    setPasswords([]);
  };

  const toggleKind = (kind: CharKind, checked: boolean) =>
    update(() =>
      setKinds((prev) => (checked ? [...prev, kind] : prev.filter((k) => k !== kind)))
    );

  const handleGenerate = () => {
    const count = clampInt(countInput, 1, MAX_COUNT);
    setLengthInput(String(length));
    setCountInput(String(count));
    setPasswords(generatePasswords(options, count));
  };

  return (
    <ToolPage
      title={name}
      guide={toolGuides["/password"]}
      description={`${description}。ブラウザの暗号論的乱数(crypto.getRandomValues)を使い、生成した値は送信されません。`}
    >
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                type="number"
                label="長さ"
                value={lengthInput}
                onChange={(e) => update(() => setLengthInput(e.target.value))}
                onBlur={() => setLengthInput(String(length))}
                slotProps={{ htmlInput: { min: MIN_LENGTH, max: MAX_LENGTH } }}
                helperText={`${MIN_LENGTH}〜${MAX_LENGTH}文字`}
                sx={{ width: { sm: 140 } }}
              />
              <TextField
                size="small"
                type="number"
                label="個数"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                onBlur={() => setCountInput(String(clampInt(countInput, 1, MAX_COUNT)))}
                slotProps={{ htmlInput: { min: 1, max: MAX_COUNT } }}
                helperText={`1〜${MAX_COUNT}`}
                sx={{ width: { sm: 120 } }}
              />
            </Stack>
            <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 2 }}>
              {CHAR_KINDS.map((kind) => (
                <FormControlLabel
                  key={kind}
                  control={
                    <Checkbox
                      size="small"
                      checked={kinds.includes(kind)}
                      onChange={(e) => toggleKind(kind, e.target.checked)}
                    />
                  }
                  label={KIND_LABELS[kind]}
                />
              ))}
            </Stack>
            <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={excludeAmbiguous}
                    onChange={(e) => update(() => setExcludeAmbiguous(e.target.checked))}
                  />
                }
                label="紛らわしい文字(0 O o 1 l I |)を除く"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={requireEach}
                    onChange={(e) => update(() => setRequireEach(e.target.checked))}
                  />
                }
                label="選んだ種類を必ず含める"
              />
            </Stack>
            {kinds.length === 0 ? (
              <Alert severity="error">文字の種類を1つ以上選んでください</Alert>
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                エントロピー: 約{Math.floor(bits)}ビット
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={<AutorenewIcon />}
              onClick={handleGenerate}
              disabled={kinds.length === 0}
              sx={{ alignSelf: "flex-start" }}
            >
              生成
            </Button>
          </Stack>
        </Paper>
        {passwords.length > 0 && (
          <CodeBlock
            title={`生成結果(${passwords.length}件)`}
            text={passwords.join("\n")}
            copyLabel="生成したパスワードをすべてコピー"
          />
        )}
      </Stack>
    </ToolPage>
  );
}
