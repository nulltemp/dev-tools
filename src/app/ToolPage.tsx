import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// ツールページ共通の外枠。見出しと説明文はナビと同じ tools.ts の内容を使う
export default function ToolPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <Box component="header" sx={{ mb: 3 }}>
        <Typography variant="h1">{title}</Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}
