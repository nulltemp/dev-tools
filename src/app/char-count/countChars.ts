// 絵文字や結合文字を1文字として数えるため、書記素単位で分割する
const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });

export const countGraphemes = (text: string): number =>
  Array.from(segmenter.segment(text)).length;
