import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import JsonLd from "./JsonLd";
import ToolPage from "./ToolPage";
import { SITE_DESCRIPTION, SITE_NAME, siteJsonLd, tools } from "./tools";

export default function Home() {
  return (
    <ToolPage title={SITE_NAME} description={SITE_DESCRIPTION}>
      <JsonLd data={siteJsonLd()} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
          gap: 2,
        }}
      >
        {tools.map((tool) => (
          <Card
            key={tool.href}
            variant="outlined"
            sx={{
              transition: "border-color 0.2s",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            <CardActionArea href={tool.href} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h2" color="primary" sx={{ mb: 0.5 }}>
                  {tool.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tool.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </ToolPage>
  );
}
