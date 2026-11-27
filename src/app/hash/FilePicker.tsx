"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import UploadFileIcon from "@mui/icons-material/UploadFile";

// ファイルを選ぶ(またはドロップする)枠。読み込みは呼び出し側で行う
export default function FilePicker({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);

  return (
    <Box
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      sx={{
        p: 2,
        border: 2,
        borderStyle: "dashed",
        borderColor: dragging ? "primary.main" : "divider",
        borderRadius: 1,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
        ファイルを選択
        <input
          type="file"
          hidden
          aria-label="ハッシュを計算するファイル"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            // 同じファイルを選び直しても onChange が起きるように空にする
            e.target.value = "";
          }}
        />
      </Button>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        ファイルの中身のハッシュを計算します(ここにドロップもできます)
      </Typography>
    </Box>
  );
}
