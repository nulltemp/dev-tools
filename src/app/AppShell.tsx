"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import { KOFI_URL, PRIVACY_POLICY_URL, SITE_NAME, tools } from "./tools";

const DRAWER_WIDTH = 240;

// ページの <h1> より前に見出しが来ないよう、サイト名は見出しにしない
function SiteName({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Typography
      component={Link}
      href="/"
      onClick={onNavigate}
      sx={{
        fontWeight: 700,
        fontSize: "1.0625rem",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      {SITE_NAME}
    </Typography>
  );
}

function DrawerContent({ onNavigate }: { onNavigate?: () => void }) {
  // 現在地の判定(aria-current)に usePathname が必要なため、クライアントコンポーネントにしている
  const pathname = usePathname();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar>
        <SiteName onNavigate={onNavigate} />
      </Toolbar>
      <Divider />
      <Box component="nav" aria-label="ツール" sx={{ flex: 1, overflowY: "auto" }}>
        <List sx={{ px: 1 }}>
          {tools.map((tool) => {
            const current = pathname === tool.href;
            return (
              <li key={tool.href}>
                <ListItemButton
                  component={Link}
                  href={tool.href}
                  selected={current}
                  aria-current={current ? "page" : undefined}
                  onClick={onNavigate}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    "&.Mui-selected": { color: "primary.main" },
                  }}
                >
                  <ListItemText
                    primary={tool.name}
                    slotProps={{
                      primary: { sx: { fontSize: "0.9375rem", fontWeight: current ? 700 : 400 } },
                    }}
                  />
                </ListItemButton>
              </li>
            );
          })}
        </List>
      </Box>
      <Divider />
      <Box
        component="footer"
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          fontSize: "0.8125rem",
          "& a": { color: "text.secondary", textDecoration: "none" },
          "& a:hover": { color: "primary.main", textDecoration: "underline" },
        }}
      >
        <a href={KOFI_URL} target="_blank" rel="noopener">
          Ko-fiで支援する
        </a>
        <a href={PRIVACY_POLICY_URL}>プライバシーポリシー</a>
      </Box>
    </Box>
  );
}

// 広い画面では左に固定のサイドバー、狭い画面では上部のバーとメニューボタンで開くドロワーにする
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          display: { md: "none" },
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setOpen(true)}
            aria-label="メニューを開く"
            aria-expanded={open}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <SiteName />
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={open}
        onClose={close}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
        }}
      >
        <DrawerContent onNavigate={close} />
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <DrawerContent />
      </Drawer>

      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 5 } }}
      >
        {/* 狭い画面で固定の AppBar に隠れないよう、その高さぶん空ける */}
        <Toolbar sx={{ display: { md: "none" } }} />
        {children}
      </Box>
    </Box>
  );
}
