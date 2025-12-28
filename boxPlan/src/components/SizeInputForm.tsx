import { useState, useEffect } from 'react';
import type { Dimensions } from '../utils/planning';
import { DimensionInput } from './DimensionInput';
import { allBoxes } from '../data/boxData';

// すべてのボックスの中から最小の寸法を計算する
const MIN_BOX_SIZE = Math.min(
  ...allBoxes.flatMap(box => [box.height, box.width, box.depth])
);

interface SizeInputFormProps {
  onCreatePlan: (dimensions: Dimensions) => void;
  initialDimensions: Dimensions | null; // Appから渡される初期値
}

const SizeInputForm = ({ onCreatePlan, initialDimensions }: SizeInputFormProps): JSX.Element => {
  const [dimensions, setDimensions] = useState<Dimensions>(initialDimensions ?? {
    height: 1000,
    width: 1200,
    depth: 550,
  });
  const [error, setError] = useState<string>('');

  // propsから渡された初期値が変更されたら、フォームの値を更新する
  useEffect(() => {
    if (initialDimensions) {
      setDimensions(initialDimensions);
    }
  }, [initialDimensions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dimensions.height < MIN_BOX_SIZE || dimensions.width < MIN_BOX_SIZE || dimensions.depth < MIN_BOX_SIZE) {
      setError(`すべての寸法に${MIN_BOX_SIZE}mm以上の値を入力してください。`);
      return;
    }
    setError('');
    onCreatePlan(dimensions);
  };

  return (
    <div className="input-section">
      <h2>スペースの寸法 (mm)</h2>
      <form onSubmit={handleSubmit}>
        <DimensionInput
          id="height"
          label="高さ"
          value={dimensions.height}
          onChange={(value) => setDimensions(prev => ({ ...prev, height: value }))}
        />
        <DimensionInput
          id="width"
          label="幅"
          value={dimensions.width}
          onChange={(value) => setDimensions(prev => ({ ...prev, width: value }))}
        />
        <DimensionInput
          id="depth"
          label="奥行き"
          value={dimensions.depth}
          onChange={(value) => setDimensions(prev => ({ ...prev, depth: value }))}
        />
        {error && <p className="error-message">{error}</p>}
        <button
          type="submit"
          className="create-plan-button"
          disabled={dimensions.height < MIN_BOX_SIZE || dimensions.width < MIN_BOX_SIZE || dimensions.depth < MIN_BOX_SIZE}
        >
          開始
        </button>
      </form>
      <style>{`
        .create-plan-button {
          padding: 0.75rem;
          border: none;
          border-radius: 4px;
          background-color: var(--primary-color);
          color: white;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .create-plan-button:hover {
          background-color: var(--secondary-color);
        }
        .create-plan-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .error-message {
          color: red;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default SizeInputForm;
