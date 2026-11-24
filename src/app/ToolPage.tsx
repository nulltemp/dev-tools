import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ToolGuide } from "./toolGuides";

// ツールページ共通の外枠。見出しと説明文はナビと同じ tools.ts の内容を使う。
// guide(toolGuides.ts)を渡すと、ツールの下に使い方と用語の解説を出す
export default function ToolPage({
  title,
  description,
  guide,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  guide?: ToolGuide;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <Box component="header" sx={{ mb: 3 }}>
        <Typography variant="h1">{title}</Typography>
        {description && (
          <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {children}
      {guide && <Guide guide={guide} />}
    </Box>
  );
}

function Guide({ guide }: { guide: ToolGuide }) {
  return (
    <Box
      component="aside"
      aria-label="使い方と用語の解説"
      sx={{ mt: 5, pt: 3, borderTop: 1, borderColor: "divider" }}
    >
      <Typography variant="h2">使い方</Typography>
      <Box component="ul" sx={{ mt: 1, mb: 3, pl: 3 }}>
        {guide.usage.map((text) => (
          <Typography key={text} component="li" variant="body2" sx={{ mb: 0.5 }}>
            {text}
          </Typography>
        ))}
      </Box>
      <Typography variant="h2">用語の解説</Typography>
      <Box component="dl" sx={{ mt: 1, mb: 0 }}>
        {guide.terms.map(({ term, text }) => (
          <Box key={term} sx={{ mb: 1.5 }}>
            <Typography component="dt" variant="body2" sx={{ fontWeight: 700 }}>
              {term}
            </Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, color: "text.secondary" }}>
              {text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
