import type { Plan, Box, Dimensions } from '../utils/planning';
import LayoutImage from './LayoutImage';
import { serializePlan } from '../utils/share';

interface PlanResultsProps {
  plans: Plan[];
  allBoxes: Box[];
  spaceDimensions: Dimensions | null;
  onBoxClick: (boxId: string, row: number, col: number, planIndex: number) => void;
}

const PlanResults = ({ plans, allBoxes, spaceDimensions, onBoxClick }: PlanResultsProps): JSX.Element => {
  const handleCopyShareUrl = (plan: Plan) => {
    if (!spaceDimensions) return;

    const encoded = serializePlan(spaceDimensions, plan);
    const shareUrl = `${window.location.origin}${window.location.pathname}?plan=${encoded}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('共有URLをクリップボードにコピーしました！');
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      alert('URLのコピーに失敗しました。');
    });
  };

  return (
    <div className="results-section">
      <h2>提案プラン</h2>
      <div className="plans-container">
        {plans.map((plan, index) => (
          <div key={plan.id} className="plan-card">
            <h3>プラン {index + 1} ({plan.manufacturer})</h3>

            <LayoutImage
              plan={plan}
              allBoxes={allBoxes}
              spaceDimensions={spaceDimensions}
              onBoxClick={(boxId, row, col) => onBoxClick(boxId, row, col, index)}
            />

            <p>スペース活用率: {plan.utilization.toFixed(1)}%</p>
            <p>高さ: {plan.totalHeight} / {spaceDimensions?.height} mm</p>
            <p>幅: {plan.totalWidth} / {spaceDimensions?.width} mm</p>
            <p>奥行き: {plan.depth} / {spaceDimensions?.depth} mm</p>
            <p>ボックス総数: {plan.boxCount}個</p>
            <p>ボックス種類: {plan.boxTypeCount}種類</p>

            <div className="box-details">
              <h4>使用ボックス詳細</h4>
              <ul>
                {Array.from(new Set(plan.boxes.map(b => b.boxId))).map(boxId => {
                  const count = plan.boxes.filter(b => b.boxId === boxId).length;
                  const box = allBoxes.find(b => b.id === boxId);
                  return (
                    <li key={boxId}>
                      <span className="box-name">{box ? box.name : boxId}</span>
                      <span className="box-count">x {count}個</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <button className="share-button" onClick={() => handleCopyShareUrl(plan)}>
              共有URLをコピー
            </button>
          </div>
        ))}
      </div>
      <style>{`
        .plans-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .plan-card {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          background-color: #fafafa;
        }
        .box-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px dashed var(--border-color);
        }
        .box-details h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
        }
        .box-details ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .box-details li {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }
        .box-name {
          font-weight: bold;
        }
        .share-button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background-color: #fff;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          width: 100%;
          transition: background-color 0.2s;
        }
        .share-button:hover {
          background-color: #f0f8ff;
        }
        @media (max-width: 600px) {
          .plan-card {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PlanResults;
