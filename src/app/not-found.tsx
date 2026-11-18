import type { Metadata } from "next";
import Button from "@mui/material/Button";
import ToolPage from "./ToolPage";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <ToolPage
      title="ページが見つかりません"
      description="お探しのページは移動または削除されたか、URLが間違っている可能性があります。"
    >
      <Button href="/" variant="contained">
        ツール一覧に戻る
      </Button>
    </ToolPage>
  );
}
