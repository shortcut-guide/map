/**
 * Excelからコピーしたデータを整理する関数
 * @param input 未整理のテキストデータ
 * @returns 整理後のデータ配列
 */
export function parseExcelData(input: string): string[] {
  // タブやスペースで区切られたデータを改行で区切る
  let lines = input.split(/\n|\t/).map(line => line.trim()).filter(line => line.length > 0);

  // 各行をさらにスペースで分割（複数データがある場合）
  const parsed: string[] = [];
  for (const line of lines) {
    const parts = line.split(/\s+/).filter(part => part.length > 0);
    parsed.push(...parts);
  }

  // 余分なスペースを削除（すでにtrim済み）
  // 連続する改行はすでにsplitで処理
  // 先頭末尾の改行はsplitで除去
  // 空行はfilterで除去

  return parsed;
}

/**
 * データから台数を抽出する関数
 * @param data 整理後のデータ
 * @returns 台数の配列
 */
export function extractCounts(data: string[]): number[] {
  return data.map(item => {
    const match = item.match(/(\d+)台$/);
    return match ? parseInt(match[1], 10) : 1;
  });
}