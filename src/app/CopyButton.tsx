"use client";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

type CopyStatus = "idle" | "copied" | "failed";

const LABELS: Record<CopyStatus, string> = {
  idle: "コピー",
  copied: "コピーしました",
  failed: "コピーに失敗しました",
};

const ICONS: Record<CopyStatus, React.ReactNode> = {
  idle: <ContentCopyIcon />,
  copied: <CheckIcon />,
  failed: <ErrorOutlineIcon />,
};

export default function CopyButton({
  text,
  label = "コピー",
}: {
  text: string;
  // 同じページに複数あっても区別できるよう、スクリーンリーダー向けの名前を指定できる
  label?: string;
}) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <Button
      size="small"
      variant="outlined"
      color={status === "failed" ? "error" : status === "copied" ? "success" : "primary"}
      startIcon={ICONS[status]}
      onClick={handleCopy}
      aria-label={status === "idle" ? label : undefined}
      aria-live="polite"
      sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
    >
      {LABELS[status]}
    </Button>
  );
}
