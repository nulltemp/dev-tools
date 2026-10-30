"use client";
import { useEffect, useState } from "react";

type CopyStatus = "idle" | "copied" | "failed";

const LABELS: Record<CopyStatus, string> = {
  idle: "コピー",
  copied: "コピーしました",
  failed: "コピーに失敗しました",
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
    <button
      type="button"
      className="copy-button"
      onClick={handleCopy}
      aria-label={status === "idle" ? label : undefined}
      aria-live="polite"
    >
      {LABELS[status]}
    </button>
  );
}
