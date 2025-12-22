// boxPlan/src/components/LayoutImage.tsx

import type { Plan, Box, Dimensions } from '../utils/planning';

interface LayoutImageProps {
  plan: Plan;
  allBoxes: Box[]; // ボックスの情報を得るために全データも必要
  spaceDimensions: Dimensions | null;
  onBoxClick?: (boxId: string, row: number, col: number) => void; // 追加
}

const LayoutImage = ({ plan, allBoxes, spaceDimensions, onBoxClick }: LayoutImageProps): JSX.Element => {
  // スペース寸法がない場合はプランの寸法をフォールバックとして使用
  const width = spaceDimensions ? spaceDimensions.width : plan.totalWidth;
  const height = spaceDimensions ? spaceDimensions.height : plan.totalHeight;

  // 行・列の開始位置を計算（左下原点用）
  // row=0 が一番下と仮定して積み上げ位置を計算
  const rowPositions: number[] = [0];
  plan.rowHeights.forEach(h => rowPositions.push(rowPositions[rowPositions.length - 1] + h));

  const colPositions: number[] = [0];
  plan.colWidths.forEach(w => colPositions.push(colPositions[colPositions.length - 1] + w));

  return (
    <div className="layout-image-container">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="layout-svg"
        // アスペクト比を維持しつつ、左下(xMinYMax)に寄せて描画
        preserveAspectRatio="xMinYMax meet"
      >
        {/* スペースの枠（背景） */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="#c0c0c0"
          stroke="#666"
          strokeWidth="5"
          strokeDasharray="5,5"
        />

        {/* ボックスの描画 */}
        {plan.boxes.map((placedBox, i) => {
          const boxDef = allBoxes.find(b => b.id === placedBox.boxId);
          if (!boxDef) return null;

          const x = colPositions[placedBox.col];
          const yBottom = rowPositions[placedBox.row];

          // SVGは左上が(0,0)なので、左下基準にするためにY座標を変換
          // y = 全体の高さ - (下からの位置 + ボックスの高さ)
          const y = height - (yBottom + boxDef.height);

          return (
            <g
              key={`${placedBox.boxId}-${placedBox.row}-${placedBox.col}-${i}`}
              onClick={() => onBoxClick?.(placedBox.boxId, placedBox.row, placedBox.col)}
              style={{ cursor: onBoxClick ? 'pointer' : 'default' }}
            >
              <rect
                x={x}
                y={y}
                width={boxDef.width}
                height={boxDef.height}
                fill={boxDef.fillcolor || '#cccccc'}
                stroke="#333"
                strokeWidth="1"
              />
              {/* ボックスサイズのテキスト表示（スペースがあれば） */}
              {boxDef.width > 40 && boxDef.height > 30 && (
                <text
                  x={x + boxDef.width / 2}
                  y={y + boxDef.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(boxDef.width / 4, boxDef.height / 3, 16)}
                  fill="#000"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {boxDef.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <style>{`
        .layout-image-container {
          width: 100%;
          border: 1px solid #eee;
          margin-bottom: 1rem;
          background-color: white;
          border-radius: 4px;
          overflow: hidden;
        }
        .layout-svg {
          width: 100%;
          height: auto;
          display: block;
          max-height: 500px;
        }
      `}</style>
    </div>
  );
};

export default LayoutImage;