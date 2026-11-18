import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CopyButton from "./CopyButton";

// 見出し・コピーボタン付きの整形済みテキスト(JSONなど)の表示
export default function CodeBlock({
  title,
  text,
  copyLabel,
  children,
}: {
  title?: string;
  text: string;
  copyLabel: string;
  // コードの下に添える補足
  children?: React.ReactNode;
}) {
  return (
    <Paper component="section" variant="outlined" sx={{ overflow: "hidden" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {title && (
          <Typography variant="h2" sx={{ fontSize: "1rem" }}>
            {title}
          </Typography>
        )}
        <Box sx={{ ml: "auto" }}>
          <CopyButton text={text} label={copyLabel} />
        </Box>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          fontFamily: "var(--font-mono)",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          maxHeight: 480,
          overflow: "auto",
          bgcolor: "action.hover",
        }}
      >
        {text}
      </Box>
      {children && (
        <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider" }}>
          {children}
        </Box>
      )}
    </Paper>
  );
}
