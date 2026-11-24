"use client";
import { useState } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import CodeBlock from "../CodeBlock";
import ToolPage from "../ToolPage";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import { clampCount, formatUuid, generateUuids, MAX_COUNT, type UuidVersion } from "./uuid";

const { name, description } = findTool("/uuid");

const VERSION_NOTES: Record<UuidVersion, string> = {
  v4: "v4: すべてランダム。一般的な識別子に。",
  v7: "v7: 先頭が生成時刻(ミリ秒)で、作った順に並ぶ。データベースの主キーに向いています。",
};

export default function UuidPage() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [countInput, setCountInput] = useState("5");
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  // 書式を変えても作り直さずに済むよう、生成した値はハイフン付き小文字で持つ
  const [uuids, setUuids] = useState<string[]>([]);

  const handleGenerate = () => {
    const count = clampCount(countInput);
    setCountInput(String(count));
    setUuids(generateUuids(version, count, {}));
  };

  const handleVersionChange = (value: UuidVersion | null) => {
    if (!value) return;
    setVersion(value);
    // 表示中の値が選んだバージョンと食い違わないよう消す
    setUuids([]);
  };

  const output = uuids.map((uuid) => formatUuid(uuid, { uppercase, hyphens })).join("\n");

  return (
    <ToolPage
      title={name}
      guide={toolGuides["/uuid"]}
      description={`${description}。ブラウザの暗号論的乱数(crypto.getRandomValues)を使い、生成した値は送信されません。`}
    >
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ alignItems: { sm: "center" } }}
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                color="primary"
                value={version}
                onChange={(_, value: UuidVersion | null) => handleVersionChange(value)}
                aria-label="UUIDのバージョン"
                sx={{ alignSelf: "flex-start" }}
              >
                <ToggleButton value="v4" sx={{ px: 2 }}>
                  v4
                </ToggleButton>
                <ToggleButton value="v7" sx={{ px: 2 }}>
                  v7
                </ToggleButton>
              </ToggleButtonGroup>
              <TextField
                size="small"
                type="number"
                label="個数"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                onBlur={() => setCountInput(String(clampCount(countInput)))}
                slotProps={{ htmlInput: { min: 1, max: MAX_COUNT } }}
                helperText={`1〜${MAX_COUNT}`}
                sx={{ width: { sm: 120 } }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {VERSION_NOTES[version]}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                  />
                }
                label="大文字"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={hyphens}
                    onChange={(e) => setHyphens(e.target.checked)}
                  />
                }
                label="ハイフンを入れる"
              />
            </Stack>
            <Button
              variant="contained"
              startIcon={<AutorenewIcon />}
              onClick={handleGenerate}
              sx={{ alignSelf: "flex-start" }}
            >
              生成
            </Button>
          </Stack>
        </Paper>
        {uuids.length > 0 && (
          <CodeBlock
            title={`生成結果(${uuids.length}件)`}
            text={output}
            copyLabel="生成したUUIDをすべてコピー"
          />
        )}
      </Stack>
    </ToolPage>
  );
}
