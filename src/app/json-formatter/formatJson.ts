export type FormatJsonResult =
  | { ok: true; formatted: string }
  | { ok: false; error: string };

export const formatJson = (input: string): FormatJsonResult => {
  try {
    return { ok: true, formatted: JSON.stringify(JSON.parse(input), null, 2) };
  } catch {
    return { ok: false, error: "無効なJSONです" };
  }
};
