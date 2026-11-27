"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useSyncExternalStore } from "react";
import { SITE_URL } from "./tools";

const PRODUCTION_HOST = new URL(SITE_URL).hostname;

const subscribe = () => () => {};

// 静的エクスポートなのでビルド時には配信先が分からない。ブラウザで本番のホスト名のときだけ GA を読み込み、
// Cloudflare Pages のプレビュー(*.pages.dev)や手元の npm run start(localhost)は計測しない
export default function Analytics({ gaId }: { gaId: string }) {
  const isProduction = useSyncExternalStore(
    subscribe,
    () => location.hostname === PRODUCTION_HOST,
    () => false
  );
  return isProduction ? <GoogleAnalytics gaId={gaId} /> : null;
}
