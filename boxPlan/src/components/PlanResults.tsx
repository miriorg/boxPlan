

import { Plan, Box } from '../utils/planning';
import LayoutImage from './LayoutImage';

interface PlanResultsProps {
  plans: Plan[];
  allBoxes: Box[];
}

const PlanResults = ({ plans, allBoxes }: PlanResultsProps): JSX.Element => {
  return (
    <div className="results-section">
      <h2>提案プラン</h2>
      <div className="plans-container">
        {plans.map((plan, index) => (
          <div key={plan.id} className="plan-card">
            <h3>プラン {index + 1} ({plan.manufacturer})</h3>
            
            <LayoutImage plan={plan} allBoxes={allBoxes} />

            <p>スペース活用率: {plan.utilization.toFixed(1)}%</p>
            <p>ボックス総数: {plan.boxCount}個</p>
            <p>ボックス種類: {plan.boxTypeCount}種類</p>
            {/* TODO: LayoutList will go here */}
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
      `}</style>
    </div>
  );
};

export default PlanResults;
