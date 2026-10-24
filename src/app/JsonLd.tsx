// 構造化データ (JSON-LD) を埋め込む。"<" をエスケープして </script> による脱出を防ぐ
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
