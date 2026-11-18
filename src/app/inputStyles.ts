import type { SxProps, Theme } from "@mui/material/styles";

// コードやデータを入力する欄は等幅フォントにする(TextField の sx に渡す)
export const monoInput: SxProps<Theme> = {
  "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.875rem" },
};
