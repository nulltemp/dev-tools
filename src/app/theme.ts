"use client";
import Link from "next/link";
import { createTheme } from "@mui/material/styles";

// 色・角丸・フォントはここで一元管理する。ダークモードは OS の設定(prefers-color-scheme)に従う
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "media" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#1565c0" },
        background: { default: "#f6f8fb", paper: "#ffffff" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#64b5f6" },
        background: { default: "#0e1116", paper: "#161b22" },
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-sans)",
    h1: { fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.4 },
    h2: { fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.5 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    // href を渡した Button・CardActionArea などを Next.js の Link で描画する(サーバーコンポーネントからも href だけで使える)
    MuiButtonBase: {
      defaultProps: { LinkComponent: Link },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true },
    },
  },
});

export default theme;
