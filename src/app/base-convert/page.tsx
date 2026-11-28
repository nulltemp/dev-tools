"use client";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import CopyButton from "../CopyButton";
import ToolPage from "../ToolPage";
import { monoInput } from "../inputStyles";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import { BASE_NAMES, BASES, formatInteger, parseInteger, type Base } from "./baseConvert";

const { name, description } = findTool("/base-convert");

const PLACEHOLDERS: Record<Base, string> = {
  2: "例: 1010_0101 または 0b1010",
  8: "例: 755 または 0o755",
  10: "例: 255 または -1_000_000",
  16: "例: ff または 0xDEAD_BEEF",
};

export default function BaseConvertPage() {
  const [input, setInput] = useState("");
  const [base, setBase] = useState<Base>(10);
  const [groupBinary, setGroupBinary] = useState(false);
  const [uppercaseHex, setUppercaseHex] = useState(false);

  // 入力と進数から毎回計算するので、入力を変えると前の結果やエラーは残らない
  const result = parseInteger(input, base);

  return (
    <ToolPage
      title={name}
      guide={toolGuides["/base-convert"]}
      description={`${description}。BigInt で計算するので桁数が多くても精度は落ちません。入力はブラウザ内で変換され、送信されません。`}
    >
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
            <ToggleButtonGroup
              size="small"
              exclusive
              color="primary"
              value={base}
              onChange={(_, value: Base | null) => value && setBase(value)}
              aria-label="入力の進数"
              sx={{ alignSelf: "flex-start", flexWrap: "wrap" }}
            >
              {BASES.map((b) => (
                <ToggleButton key={b} value={b} sx={{ px: 2 }}>
                  {BASE_NAMES[b]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField
              fullWidth
              label={`${BASE_NAMES[base]}の値`}
              placeholder={PLACEHOLDERS[base]}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              slotProps={{
                htmlInput: { "aria-label": "変換する数値", spellCheck: false },
              }}
              helperText="接頭辞(0x・0b・0o)は選んだ進数と同じものだけ使えます。「_」と空白は桁区切りとして無視します"
              sx={monoInput}
            />
            <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={groupBinary}
                    onChange={(e) => setGroupBinary(e.target.checked)}
                  />
                }
                label="2進数を4桁ごとに区切る"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={uppercaseHex}
                    onChange={(e) => setUppercaseHex(e.target.checked)}
                  />
                }
                label="16進数を大文字にする"
              />
            </Stack>
          </Stack>
        </Paper>
        {result && !result.ok && <Alert severity="error">{result.error}</Alert>}
        {result?.ok && (
          <Paper variant="outlined" sx={{ px: { xs: 2, sm: 2.5 }, py: 1 }}>
            <Box component="dl" sx={{ m: 0 }}>
              {BASES.map((b) => {
                const text = formatInteger(result.value, b, { groupBinary, uppercaseHex });
                return (
                  <Box
                    key={b}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr auto", sm: "6rem 1fr auto" },
                      alignItems: "center",
                      columnGap: 2,
                      rowGap: 0.25,
                      py: 1,
                      borderBottom: 1,
                      borderColor: "divider",
                      "&:last-of-type": { borderBottom: 0 },
                    }}
                  >
                    <Typography
                      component="dt"
                      variant="body2"
                      sx={{ color: "text.secondary", gridColumn: { xs: "1 / -1", sm: "auto" } }}
                    >
                      {BASE_NAMES[b]}
                    </Typography>
                    <Box
                      component="dd"
                      sx={{
                        m: 0,
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.875rem",
                        overflowWrap: "anywhere",
                        minWidth: 0,
                      }}
                    >
                      {text}
                    </Box>
                    <Box component="dd" sx={{ m: 0, display: "flex", alignItems: "center" }}>
                      <CopyButton text={text} label={`${BASE_NAMES[b]}をコピー`} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}
      </Stack>
    </ToolPage>
  );
}
