// 絵文字や結合文字を1文字として数えるため、書記素単位で分割する
const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });

export const countGraphemes = (text: string): number =>
  Array.from(segmenter.segment(text)).length;

// 全角スペースなども空白として除くため、\s(Unicode の空白・改行)で判定する
export const countGraphemesWithoutWhitespace = (text: string): number =>
  countGraphemes(text.replace(/\s/gu, ""));

// 空文字は0行。CRLF・CR・LF のいずれも1つの改行として数え、末尾の改行の後も1行と数える
export const countLines = (text: string): number =>
  text === "" ? 0 : text.split(/\r\n|\r|\n/).length;

const encoder = new TextEncoder();

export const countUtf8Bytes = (text: string): number => encoder.encode(text).length;
