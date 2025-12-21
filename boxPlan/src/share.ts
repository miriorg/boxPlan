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
  [key: string]: any;
}

export interface PlanResult {
  boxes: BoxData[]; // 配置されたボックスのリスト
  // 必要に応じてレイアウト座標などの情報もここに含まれる想定
  [key: string]: any;
}

export interface SharedData {
  input: UserInput;
  plan: PlanResult;
}

/**
 * プランデータをシリアライズしてBase64文字列に変換する
 * 日本語などのマルチバイト文字にも対応
 */
export const serializePlan = (input: UserInput, plan: PlanResult): string => {
  try {
    const data: SharedData = { input, plan };
    const jsonString = JSON.stringify(data);

    // Unicode文字列をBase64エンコード可能な形式に変換
    // encodeURIComponentでUTF-8化し、%XX形式を文字コードに変換してからbtoa
    const utf8String = encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g,
      (match, p1) => String.fromCharCode(parseInt(p1, 16))
    );

    return btoa(utf8String);
  } catch (error) {
    console.error("Failed to serialize plan:", error);
    return "";
  }
};

/**
 * Base64文字列をデシリアライズしてプランデータを復元する
 */
export const deserializePlan = (encoded: string): SharedData | null => {
  try {
    if (!encoded) return null;

    // Base64デコードしてUnicode文字列に戻す
    const utf8String = atob(encoded);
    const jsonString = decodeURIComponent(utf8String.split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const data = JSON.parse(jsonString);

    // 簡易バリデーション: 必須プロパティの存在確認
    if (!data || typeof data !== 'object' || !data.input || !data.plan) {
      console.warn("Invalid plan data structure");
      return null;
    }

    return data as SharedData;
  } catch (error) {
    console.error("Failed to deserialize plan:", error);
    return null;
  }
};