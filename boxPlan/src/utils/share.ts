import pako from 'pako';

// 型定義（仮） - 実際のプロジェクトの型定義に合わせて調整してください
export interface UserInput {
  height: number;
  width: number;
  depth: number;
}

// ボックス情報の型定義（仮）
export interface BoxData {
  manufacturer: string;
  name: string; // 品番や名称
  height: number;
  width: number;
  depth: number;
  count?: number;
  fillcolor?: string;
  [key: string]: any;
}

export interface PlanResult {
  boxes: BoxData[]; // 配置されたボックスのリスト
  // 必要に応じてレイアウト座標などの情報もここに含まれる想定
  [key: string]: any;
}

export interface SharedData<T = PlanResult> {
  input: UserInput;
  plan: T;
}

// Base64とUint8Arrayを変換するヘルパー
// https://stackoverflow.com/a/12710001 を参考に、大きな配列に対応
const uint8ArrayToString = (array: Uint8Array): string => {
  // Uint8Arrayをチャンクに分けて処理することで、Maximum call stack size exceededエラーを回避
  const CHUNK_SIZE = 0x8000; // 32k
  const c = [];
  for (let i = 0; i < array.length; i += CHUNK_SIZE) {
    c.push(String.fromCharCode.apply(null, array.subarray(i, i + CHUNK_SIZE) as unknown as number[]));
  }
  return c.join('');
};

const stringToUint8Array = (str: string): Uint8Array => {
  const len = str.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
};

/**
 * プランデータを圧縮・シリアライズしてURLセーフなBase64文字列に変換する
 * 日本語などのマルチバイト文字にも対応
 */
export const serializePlan = <T>(input: UserInput, plan: T): string => {
  try {
    // データ量を削減するためにキー名を短縮する
    const p = plan as any;
    const minified = { // prettier-ignore
      i: {
        h: input.height,
        w: input.width,
        d: input.depth,
      },
      p: {
        m: p.manufacturer,
        d: p.depth,
        th: p.totalHeight,
        tw: p.totalWidth,
        u: parseFloat((p.utilization || 0).toFixed(2)),
        rh: p.rowHeights,
        cw: p.colWidths,
        bc: p.boxCount,
        btc: p.boxTypeCount,
        b: p.boxes.map((b: any) => ({ i: b.boxId, r: b.row, c: b.col })),
      }
    };

    const jsonString = JSON.stringify(minified);

    // JSON文字列をpakoでgzip圧縮
    const compressed = pako.deflate(jsonString);

    // 圧縮データをBase64にエンコード
    const base64 = btoa(uint8ArrayToString(compressed));

    // URLセーフな形式に変換（+, /, = を置換）
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error("Failed to serialize plan:", error);
    return "";
  }
};

// 復元ロジックを別関数に切り出し
const restorePlan = <T = PlanResult>(minified: any): SharedData<T> | null => {
  // 簡易バリデーション
  if (!minified || typeof minified !== 'object' || !minified.i || !minified.p) {
    return null;
  }

  const input: UserInput = {
    height: minified.i.h,
    width: minified.i.w,
    depth: minified.i.d,
  };

  const plan: any = {
    id: `shared-${Date.now()}`, // IDはユニークなものを生成
    manufacturer: minified.p.m,
    depth: minified.p.d,
    totalHeight: minified.p.th,
    totalWidth: minified.p.tw,
    utilization: minified.p.u,
    rowHeights: minified.p.rh,
    colWidths: minified.p.cw,
    boxCount: minified.p.bc,
    boxTypeCount: minified.p.btc,
    boxes: minified.p.b.map((b: any) => ({ boxId: b.i, row: b.r, col: b.c })),
  };

  return { input, plan: plan as T };
};

/**
 * URLセーフなBase64文字列をデシリアライズ・伸長してプランデータを復元する
 * 過去の形式との後方互換性も維持する
 */
export const deserializePlan = <T = PlanResult>(encoded: string): SharedData<T> | null => {
  try {
    if (!encoded) return null;

    // 1. 新形式（pako圧縮 + URL-safe Base64）のデコードを試みる
    try {
      let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const compressed = stringToUint8Array(atob(base64));
      const jsonString = pako.inflate(compressed, { to: 'string' });
      const minified = JSON.parse(jsonString);
      const result = restorePlan(minified);
      if (result) return result as SharedData<T>;
    } catch (e) {
      /* 新形式でなければ失敗するが、次の形式を試す */
    }

    // 2. 旧形式（非圧縮）のデコードを試みる
    try {
      const utf8String = atob(encoded);
      const jsonString = decodeURIComponent(
        utf8String
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const data = JSON.parse(jsonString);

      // 2a. 旧形式（短縮なし）
      if (data.input && data.plan) {
        return data as SharedData<T>;
      }
      // 2b. 旧形式（短縮あり）
      const result = restorePlan(data);
      if (result) return result as SharedData<T>;
    } catch (e) {
      /* この形式でもなければ失敗 */
    }

    console.warn('Failed to deserialize plan with any known format.');
    return null;
  } catch (error) {
    console.error("Failed to deserialize plan:", error);
    return null;
  }
};