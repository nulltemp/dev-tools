"use client";
import { useState, useSyncExternalStore } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import {
  formatDateTime,
  formatIso,
  formatRelative,
  parseDateTime,
  parseTimestamp,
  type TimestampUnit,
} from "./timestamp";

const { name, description } = findTool("/unix-timestamp");

type ZoneChoice = "local" | "utc";

// ブラウザのタイムゾーンはサーバーでの事前レンダリング時には分からないので、
// クライアントでだけ読む(サーバーでは null)
const subscribeNothing = () => () => {};
const useLocalTimeZone = () =>
  useSyncExternalStore(
    subscribeNothing,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null
  );

interface ResultRow {
  label: string;
  value: string;
  copyable?: boolean;
}

// 狭い画面では項目名を上の行に、値とコピーボタンを下の行に並べる
function ResultTable({ rows }: { rows: ResultRow[] }) {
  return (
    <Box component="dl" sx={{ m: 0 }}>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr auto", sm: "minmax(8rem, max-content) 1fr auto" },
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
            {row.label}
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
            {row.value}
          </Box>
          <Box component="dd" sx={{ m: 0, minHeight: 30, display: "flex", alignItems: "center" }}>
            {row.copyable !== false && (
              <CopyButton text={row.value} label={`${row.label}をコピー`} />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// 入力欄・選択肢・「現在時刻」ボタンと、変換結果をまとめた1つの変換方向
function ConverterSection({
  title,
  controls,
  children,
}: {
  title: string;
  controls: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Typography variant="h2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" } }}
      >
        {controls}
      </Stack>
      {children && <Stack spacing={1.5} sx={{ mt: 2 }}>{children}</Stack>}
    </Paper>
  );
}

export default function UnixTimestampPage() {
  const localTimeZone = useLocalTimeZone();

  // タイムスタンプ → 日時
  const [timestampInput, setTimestampInput] = useState("");
  const [unit, setUnit] = useState<TimestampUnit>("auto");
  // 相対時間の基準。入力が変わったときに更新する
  const [now, setNow] = useState(0);

  // 日時 → タイムスタンプ
  const [dateInput, setDateInput] = useState("");
  const [zone, setZone] = useState<ZoneChoice>("local");

  const handleTimestampChange = (value: string) => {
    setTimestampInput(value);
    setNow(Date.now());
  };

  const handleTimestampNow = () => {
    const current = Date.now();
    setTimestampInput(String(Math.floor(current / 1000)));
    setUnit("auto");
    setNow(current);
  };

  const handleDateNow = () => {
    if (!localTimeZone) return;
    const timeZone = zone === "utc" ? "UTC" : localTimeZone;
    setDateInput(formatDateTime(new Date(Math.floor(Date.now() / 1000) * 1000), timeZone));
  };

  // 入力から直接計算するので、入力と食い違った古い結果は残らない
  const timestampResult =
    timestampInput.trim() && localTimeZone
      ? parseTimestamp(timestampInput, unit)
      : null;
  const dateTimeZone = zone === "utc" ? "UTC" : localTimeZone;
  const dateResult =
    dateInput.trim() && dateTimeZone ? parseDateTime(dateInput, dateTimeZone) : null;

  return (
    <ToolPage
      title={name}
      description={
        <>
          {description}。日時はブラウザのタイムゾーン
          {localTimeZone && `(${localTimeZone})`}
          とUTCで表示します。入力はブラウザ内で変換され、送信されません。
        </>
      }
    >
      <Stack spacing={3}>
        <ConverterSection
          title="タイムスタンプ → 日時"
          controls={
            <>
              <TextField
                size="small"
                value={timestampInput}
                onChange={(e) => handleTimestampChange(e.target.value)}
                placeholder="例: 1700000000"
                slotProps={{
                  htmlInput: {
                    inputMode: "decimal",
                    "aria-label": "変換するUnixタイムスタンプ",
                  },
                }}
                sx={monoInput}
              />
              <ToggleButtonGroup
                size="small"
                exclusive
                value={unit}
                // 選択中のボタンをもう一度押すと null になるので、そのときは変えない
                onChange={(_, value: TimestampUnit | null) => value && setUnit(value)}
                aria-label="タイムスタンプの単位"
                sx={{ flexShrink: 0 }}
              >
                <ToggleButton value="auto">自動判定</ToggleButton>
                <ToggleButton value="seconds">秒</ToggleButton>
                <ToggleButton value="milliseconds">ミリ秒</ToggleButton>
              </ToggleButtonGroup>
              <Button variant="outlined" onClick={handleTimestampNow} sx={{ flexShrink: 0 }}>
                現在時刻
              </Button>
            </>
          }
        >
          {timestampResult && !timestampResult.ok && (
            <Alert severity="error">{timestampResult.error}</Alert>
          )}
          {timestampResult?.ok && localTimeZone && (
            <>
              <ResultTable
                rows={[
                  {
                    label: `ローカル(${localTimeZone})`,
                    value: formatDateTime(timestampResult.date, localTimeZone),
                  },
                  { label: "UTC", value: formatDateTime(timestampResult.date, "UTC") },
                  { label: "ISO 8601", value: formatIso(timestampResult.date, localTimeZone) },
                  {
                    label: "現在との差",
                    value: formatRelative(timestampResult.date, now),
                    copyable: false,
                  },
                ]}
              />
              {unit === "auto" && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {timestampResult.unit === "seconds" ? "秒" : "ミリ秒"}
                  として解釈しました(桁数から自動判定)
                </Typography>
              )}
            </>
          )}
        </ConverterSection>

        <ConverterSection
          title="日時 → タイムスタンプ"
          controls={
            <>
              <TextField
                size="small"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                placeholder="例: 2026-11-17 12:34:56"
                slotProps={{ htmlInput: { "aria-label": "変換する日時" } }}
                sx={monoInput}
              />
              <ToggleButtonGroup
                size="small"
                exclusive
                value={zone}
                onChange={(_, value: ZoneChoice | null) => value && setZone(value)}
                aria-label="日時のタイムゾーン"
                sx={{ flexShrink: 0 }}
              >
                <ToggleButton value="local">ローカル</ToggleButton>
                <ToggleButton value="utc">UTC</ToggleButton>
              </ToggleButtonGroup>
              <Button variant="outlined" onClick={handleDateNow} sx={{ flexShrink: 0 }}>
                現在時刻
              </Button>
            </>
          }
        >
          {dateResult && !dateResult.ok && <Alert severity="error">{dateResult.error}</Alert>}
          {dateResult?.ok && (
            <ResultTable
              rows={[
                {
                  label: "秒",
                  value: String(Math.floor(dateResult.date.getTime() / 1000)),
                },
                { label: "ミリ秒", value: String(dateResult.date.getTime()) },
                { label: "ISO 8601(UTC)", value: formatIso(dateResult.date, "UTC") },
              ]}
            />
          )}
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            「2026-11-17T12:34:56+09:00」のようにオフセットを付けると、選んだタイムゾーンより優先します。
          </Typography>
        </ConverterSection>
      </Stack>
    </ToolPage>
  );
}
