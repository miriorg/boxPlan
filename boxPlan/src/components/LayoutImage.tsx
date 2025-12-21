// boxPlan/src/components/LayoutImage.tsx

import { Plan, Box } from '../utils/planning';

interface LayoutImageProps {
  plan: Plan;
  allBoxes: Box[]; // ボックスの情報を得るために全データも必要
  onBoxClick?: (boxId: string, row: number, col: number) => void; // 追加
}

const LayoutImage = ({ plan, allBoxes, onBoxClick }: LayoutImageProps): JSX.Element => { // props に onBoxClick を追加
  const { totalWidth, totalHeight, rowHeights, colWidths, boxes } = plan;

  // ボックスの面積に応じて色を計算する（仮実装）
  // TODO: 仕様に基づいた正確なグラデーション計算を実装
  const getColorForBox = (boxId: string): string => {
    const box = allBoxes.find(b => b.id === boxId);
    if (!box) return '#ccc'; // 見つからない場合はグレー
    // 簡単な面積に基づくハッシュ的な色生成
    const area = box.width * box.height;
    const r = (area / 1000) % 255;
    const g = (area / 500) % 255;
    const b = (area / 250) % 255;
    return `rgb(${r},${g},${b})`;
  };

  let yOffset = 0;
  const renderedBoxes = [];

  for (let i = 0; i < rowHeights.length; i++) {
    const rowHeight = rowHeights[i];
    let xOffset = 0;
    for (let j = 0; j < colWidths.length; j++) {
      const colWidth = colWidths[j];
      const boxInfo = boxes.find(b => b.row === i && b.col === j);
      
      if (boxInfo) {
        renderedBoxes.push(
          <rect
            key={boxInfo.boxId + `-${i}-${j}`}
            x={xOffset}
            y={yOffset}
            width={colWidth}
            height={rowHeight}
            fill={getColorForBox(boxInfo.boxId)}
            stroke="#333"
            strokeWidth="1"
            onClick={() => onBoxClick && onBoxClick(boxInfo.boxId, i, j)} // 追加
            style={{ cursor: onBoxClick ? 'pointer' : 'default' }} // 追加
          />
        );
      }
      xOffset += colWidth;
    }
    yOffset += rowHeight;
  }

  return (
    <div className="layout-image-container">
      <svg
        width="100%"
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {renderedBoxes}
      </svg>
    </div>
  );
};

export default LayoutImage;