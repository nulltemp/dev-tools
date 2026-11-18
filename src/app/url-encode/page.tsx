"use client";
import EncodeDecodeTool from "../EncodeDecodeTool";
import ToolPage from "../ToolPage";
import { findTool } from "../tools";
import { decodeUrl, encodeUrl } from "./urlEncode";

const { name, description } = findTool("/url-encode");

export default function UrlEncodePage() {
  return (
    <ToolPage
      title={name}
      description={`${description}。クエリパラメーターの値などに使う形式(encodeURIComponent 相当)です。入力はブラウザ内で変換され、送信されません。`}
    >
      <EncodeDecodeTool
        encode={(text, form) => encodeUrl(text, { form })}
        decode={(text, form) => decodeUrl(text, { form })}
        option={{ label: "スペースを「+」で表す(フォーム形式)", appliesTo: ["encode", "decode"] }}
        placeholders={{
          encode: "エンコードするテキストを入力してください",
          decode: "デコードするテキストを入力してください(例: %E6%9D%B1%E4%BA%AC)",
        }}
      />
    </ToolPage>
  );
}
