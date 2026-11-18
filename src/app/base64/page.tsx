"use client";
import EncodeDecodeTool from "../EncodeDecodeTool";
import ToolPage from "../ToolPage";
import { findTool } from "../tools";
import { decodeBase64, encodeBase64 } from "./base64";

const { name, description } = findTool("/base64");

export default function Base64Page() {
  return (
    <ToolPage
      title={name}
      description={`${description}。日本語などは UTF-8 として扱います。入力はブラウザ内で変換され、送信されません。`}
    >
      <EncodeDecodeTool
        encode={(text, urlSafe) => ({ ok: true, text: encodeBase64(text, { urlSafe }) })}
        // デコードは通常の Base64 と URLセーフのどちらも自動で受け付ける
        decode={(text) => decodeBase64(text)}
        option={{ label: "URLセーフ(Base64URL)", appliesTo: ["encode"] }}
        placeholders={{
          encode: "エンコードするテキストを入力してください",
          decode: "デコードするBase64を入力してください",
        }}
      />
    </ToolPage>
  );
}
