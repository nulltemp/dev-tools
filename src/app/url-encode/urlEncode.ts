export type UrlConvertResult = { ok: true; text: string } | { ok: false; error: string };

// form は application/x-www-form-urlencoded 形式(スペースを + で表す)
interface Options {
  form?: boolean;
}

// encodeURIComponent と同じく、英数字と - _ . ! ~ * ' ( ) 以外をすべてパーセントエンコードする
export const encodeUrl = (text: string, { form = false }: Options = {}): UrlConvertResult => {
  try {
    const encoded = encodeURIComponent(text);
    return { ok: true, text: form ? encoded.replace(/%20/g, "+") : encoded };
  } catch {
    // 対になっていないサロゲート(壊れた絵文字など)は UTF-8 にできない
    return { ok: false, error: "UTF-8に変換できない文字が含まれています" };
  }
};

export const decodeUrl = (text: string, { form = false }: Options = {}): UrlConvertResult => {
  const source = form ? text.replace(/\+/g, " ") : text;

  const malformed = source.search(/%(?![0-9A-Fa-f]{2})/);
  if (malformed !== -1) {
    return {
      ok: false,
      error: `${malformed + 1}文字目の「%」の後に2桁の16進数がありません`,
    };
  }

  try {
    return { ok: true, text: decodeURIComponent(source) };
  } catch {
    return { ok: false, error: "UTF-8として正しくないバイト列が含まれています" };
  }
};
