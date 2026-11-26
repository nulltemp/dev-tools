"use client";
import EncodeDecodeTool from "../EncodeDecodeTool";
import ToolPage from "../ToolPage";
import { findTool } from "../tools";
import { toolGuides } from "../toolGuides";
import BinaryResult from "./BinaryResult";
import FileEncoder from "./FileEncoder";
import { decodeBase64, encodeBase64 } from "./base64";

const { name, description } = findTool("/base64");

export default function Base64Page() {
  return (
    <ToolPage
      title={name}
      guide={toolGuides["/base64"]}
      description={`${description}。テキストは UTF-8 として扱い、画像などのファイルも変換できます。入力はブラウザ内で変換され、送信されません。`}
    >
      <EncodeDecodeTool
        encode={(text, urlSafe) => ({ ok: true, text: encodeBase64(text, { urlSafe }) })}
        // デコードは通常の Base64 と URLセーフのどちらも自動で受け付ける。
        // テキストとして読めないときは、バイナリとして中身の確認と保存ができるようにする
        decode={(text) => {
          const result = decodeBase64(text);
          if (result.ok || !result.bytes) return result;
          return {
            ok: false,
            severity: "info",
            error: "UTF-8のテキストではないため、バイナリデータとして表示しています",
            details: <BinaryResult bytes={result.bytes} mimeType={result.mimeType} />,
          };
        }}
        option={{ label: "URLセーフ(Base64URL)", appliesTo: ["encode"] }}
        placeholders={{
          encode: "エンコードするテキストを入力してください",
          decode: "デコードするBase64(data URLも可)を入力してください",
        }}
      >
        {(mode, optionChecked) => mode === "encode" && <FileEncoder urlSafe={optionChecked} />}
      </EncodeDecodeTool>
    </ToolPage>
  );
}
