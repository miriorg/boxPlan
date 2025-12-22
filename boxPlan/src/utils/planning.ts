// boxPlan/src/utils/planning.ts

// --- データ型の定義 ---

// boxData.js からインポートするデータの型
export interface Box {
  id: string;
  manufacturer: string;
  name: string;
  height: number;
  width: number;
  depth: number;
  fillcolor?: string;
}

// ユーザーが入力するスペースの寸法
export interface Dimensions {
  height: number;
  width: number;
  depth: number;
}

// 提案するプランの構成要素
export interface PlacedBox {
  boxId: string;
  row: number; // グリッド内の行インデックス
  col: number; // グリッド内の列インデックス
}

// 最終的に生成されるプランの型
export interface Plan {
  id: string; // planを一意に識別するID
  manufacturer: string;
  depth: number;
  totalHeight: number;
  totalWidth: number;
  utilization: number; // 0-100
  rowHeights: number[]; // 各行の高さ
  colWidths: number[];  // 各列の幅
  boxes: PlacedBox[]; // 配置されたボックスの情報
  boxCount: number; // ボックス総数
  boxTypeCount: number; // ボックスの種類数
}


/**
 * 与えられたスペースの寸法とボックスデータに基づき、最適な収納プランを複数作成する
 * @param spaceDimensions ユーザーが入力したスペースの寸法
 * @param allBoxes 利用可能なすべてのボックスのデータ配列
 * @returns 最適化されたプランの配列
 */
export const createPlans = (spaceDimensions: Dimensions, allBoxes: Box[]): Plan[] => {
  console.log('--- Start Planning ---');
  console.log('Space Dimensions:', spaceDimensions);

  // 1. ボックスをメーカーと奥行きでグループ化
  const groupedByDepthAndMaker = allBoxes.reduce((acc, box) => {
    // ユーザー指定の奥行きより大きいボックスは除外
    if (box.depth > spaceDimensions.depth) {
      return acc;
    }

    const key = `${box.manufacturer}-${box.depth}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(box);
    return acc;
  }, {} as Record<string, Box[]>);

  console.log('Grouped Boxes:', groupedByDepthAndMaker);

  const allGeneratedPlans: Plan[] = [];

  // 2. 各グループで最適な組み合わせを探索
  for (const key in groupedByDepthAndMaker) {
    const boxGroup = groupedByDepthAndMaker[key];
    const manufacturer = boxGroup[0].manufacturer;
    const depth = boxGroup[0].depth;

    console.log(`Processing group: ${manufacturer} - ${depth}mm`);

    const uniqueHeights = [...new Set(boxGroup.map(b => b.height))];
    const uniqueWidths = [...new Set(boxGroup.map(b => b.width))];

    const heightCombinations = findBestCombinations(spaceDimensions.height, uniqueHeights);
    const widthCombinations = findBestCombinations(spaceDimensions.width, uniqueWidths);

    // 3. グリッド(プラン)の生成と評価
    for (const heights of heightCombinations) {
      for (const widths of widthCombinations) {
        if (heights.length === 0 || widths.length === 0) continue;

        const totalHeight = heights.reduce((a, b) => a + b, 0);
        const totalWidth = widths.reduce((a, b) => a + b, 0);

        // ユーザー指定のスペース体積
        // 奥行きはグループのものを利用
        const spaceVolume = spaceDimensions.height * spaceDimensions.width * depth;

        let planVolume = 0;
        const placedBoxes: PlacedBox[] = [];
        const boxTypes = new Set<string>();
        let isValidGrid = true;

        for (let r = 0; r < heights.length; r++) {
          for (let c = 0; c < widths.length; c++) {
            const h = heights[r];
            const w = widths[c];
            const box = boxGroup.find(b => b.height === h && b.width === w);
            if (box) {
              planVolume += box.height * box.width * box.depth;
              placedBoxes.push({ boxId: box.id, row: r, col: c });
              boxTypes.add(box.id);
            } else {
              isValidGrid = false;
              break;
            }
          }
          if (!isValidGrid) break;
        }

        if (!isValidGrid) {
          continue; // 全てのセルを埋められなかったので有効なプランではない
        }

        const utilization = spaceVolume > 0 ? (planVolume / spaceVolume) * 100 : 0;

        const newPlan: Plan = {
          id: `plan-${manufacturer}-${depth}-${allGeneratedPlans.length}`,
          manufacturer,
          depth,
          totalHeight,
          totalWidth,
          utilization,
          rowHeights: heights,
          colWidths: widths,
          boxes: placedBoxes,
          boxCount: placedBoxes.length,
          boxTypeCount: boxTypes.size,
        };
        allGeneratedPlans.push(newPlan);
      }
    }
  }

  // 4. 評価基準でプランをソート
  allGeneratedPlans.sort((a, b) => {
    // 優先度1: 活用率
    const utilA = Math.floor(a.utilization);
    const utilB = Math.floor(b.utilization);
    if (utilA !== utilB) {
      return utilB - utilA; // 降順
    }

    // 優先度2: ボックス総数 (活用率が同程度の場合)
    if (a.boxCount !== b.boxCount) {
      return a.boxCount - b.boxCount; // 昇順
    }

    // 優先度3: ボックス種類数 (上記2つが同じ場合)
    return b.boxTypeCount - a.boxTypeCount; // 降順
  });


  console.log('--- End Planning ---');

  // 上位3件を返す
  return allGeneratedPlans.slice(0, 3);
};


/**
 * 1次元ナップサック問題を解き、目標サイズに収まる最適なアイテムの組み合わせを見つける
 * @param targetSize 目標サイズ (例: スペースの高さ)
 * @param itemSizes 利用可能なアイテムのサイズ配列 (例: ボックスの高さリスト)
 * @returns 最適な組み合わせの配列のリスト
 */
const findBestCombinations = (targetSize: number, itemSizes: number[]): number[][] => {
  // dp[i] は、合計サイズ i を達成するために使用した最後のアイテムのサイズを記録する。
  // 0 は未達、-1 は初期状態を示す。
  const dp = new Array(targetSize + 1).fill(0);
  dp[0] = -1; // サイズ 0 は何も使わずに達成可能

  for (let i = 1; i <= targetSize; i++) {
    for (const size of itemSizes) {
      if (i >= size && dp[i - size] !== 0) {
        // サイズ i-size が達成可能であれば、そこにアイテム size を追加することで
        // サイズ i も達成可能になる。
        // ここでは単純に最初に到達した組み合わせを記録する。
        dp[i] = size;
        break; // 1つの組み合わせが見つかればOK
      }
    }
  }

  // DPテーブルから最適な組み合わせを復元する
  // targetSize から始めて、最も近い達成可能なサイズを探す
  let currentSize = targetSize;
  while (dp[currentSize] === 0 && currentSize > 0) {
    currentSize--;
  }

  if (currentSize === 0) {
    return []; // 何も組み合わせが見つからなかった
  }

  // 組み合わせをバックトラックして復元
  const bestCombination: number[] = [];
  let tempSize = currentSize;
  while (tempSize > 0) {
    const lastItem = dp[tempSize];
    if (lastItem === 0 || lastItem === -1) break;
    bestCombination.push(lastItem);
    tempSize -= lastItem;
  }

  // 今回は最もシンプルな1つの組み合わせだけを返すロジックとして実装
  // TODO: 複数の良い組み合わせを返すように拡張する
  return bestCombination.length > 0 ? [bestCombination] : [];
};

/**
 * Plan オブジェクトをURLパラメータ用の文字列にエンコードする
 * @param plan エンコードするプランオブジェクト
 * @returns エンコードされた文字列
 */
export const encodePlanToString = (plan: Plan): string => {
  const simplifiedPlan = {
    manufacturer: plan.manufacturer,
    depth: plan.depth,
    rowHeights: plan.rowHeights,
    colWidths: plan.colWidths,
    boxes: plan.boxes.map(b => ({ id: b.boxId, r: b.row, c: b.col })), // boxId, row, col のみ
  };
  const jsonString = JSON.stringify(simplifiedPlan);
  return btoa(encodeURIComponent(jsonString)); // URLセーフなBase64エンコード
};

/**
 * URLパラメータの文字列から Plan オブジェクトをデコードする
 * @param encodedString エンコードされた文字列
 * @param allBoxes 利用可能なすべてのボックスのデータ配列
 * @returns デコードされたプランオブジェクト、または null
 */
export const decodeStringToPlan = (encodedString: string, allBoxes: Box[]): Plan | null => {
  try {
    // Base64として有効な文字が含まれているか簡易的にチェック
    if (!/^[A-Za-z0-9+/=]*$/.test(encodedString)) {
      console.error("Invalid Base64 characters in encoded string.");
      return null;
    }
    const jsonString = decodeURIComponent(atob(encodedString));
    const simplifiedPlan = JSON.parse(jsonString);

    // 必要なプロパティがあるか検証
    if (!simplifiedPlan.manufacturer || !simplifiedPlan.depth || !simplifiedPlan.rowHeights || !simplifiedPlan.colWidths || !simplifiedPlan.boxes) {
      console.error("Decoded plan is missing required properties.");
      return null;
    }

    // `PlacedBox` の boxId から `Box` オブジェクトの完全な情報を再構築
    const reconstructedBoxes: PlacedBox[] = simplifiedPlan.boxes.map((b: { id: string; r: number; c: number }) => ({
      boxId: b.id,
      row: b.r,
      col: b.c,
    }));

    // TODO: ここで totalHeight, totalWidth, utilization, boxCount, boxTypeCount を再計算するロジックを追加する
    // 現在の簡易実装では0が返される。

    // 再計算に必要な情報が simplifiedPlan に不足している。
    // そのため、デコード後のプランを完全な状態で復元するには、元のプラン生成ロジックの一部を再利用するか、
    // シリアライズする情報をもっと増やす必要がある。
    // とりあえず、簡易的に0を返す。

    // デコードされたプランの妥当性を確認し、不足している情報を allBoxes から補完
    let totalHeight = simplifiedPlan.rowHeights.reduce((sum: number, h: number) => sum + h, 0);
    let totalWidth = simplifiedPlan.colWidths.reduce((sum: number, w: number) => sum + w, 0);
    let planVolume = 0;
    const boxTypeIds = new Set<string>();

    reconstructedBoxes.forEach(pBox => {
        const box = allBoxes.find(b => b.id === pBox.boxId);
        if (box) {
            planVolume += box.height * box.width * box.depth;
            boxTypeIds.add(box.id);
        }
    });

    // utilization の計算には、元のスペースの寸法が必要。
    // しかし、URLからはスペースの寸法が取得できないため、
    // ここで正確な utilization を計算することはできない。
    // デコードされたプランがそのまま利用されることを想定するなら、
    // URLにスペースの寸法もエンコードする必要がある。
    // 一旦、ここでは0とする。

    const reconstructedPlan: Plan = {
      id: `decoded-plan-${Date.now()}`, // 新しいIDを付与
      manufacturer: simplifiedPlan.manufacturer,
      depth: simplifiedPlan.depth,
      rowHeights: simplifiedPlan.rowHeights,
      colWidths: simplifiedPlan.colWidths,
      boxes: reconstructedBoxes,

      totalHeight: totalHeight,
      totalWidth: totalWidth,
      utilization: 0, // 厳密な計算はスペース寸法が必要
      boxCount: reconstructedBoxes.length,
      boxTypeCount: boxTypeIds.size,
    };

    return reconstructedPlan;

  } catch (error) {
    console.error("Failed to decode plan string:", error);
    return null;
  }
};
