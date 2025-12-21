import { useState } from 'react';
import { Dimensions } from '../utils/planning';

interface SizeInputFormProps {
  onCreatePlan: (dimensions: Dimensions) => void;
}

const SizeInputForm = ({ onCreatePlan }: SizeInputFormProps): JSX.Element => {
  const [dimensions, setDimensions] = useState<Dimensions>({
    height: 1000,
    width: 1200,
    depth: 550,
  });
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDimensions(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseInt(value, 10),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dimensions.height <= 0 || dimensions.width <= 0 || dimensions.depth <= 0) {
      setError('すべての寸法に正の値を入力してください。');
      return;
    }
    setError('');
    onCreatePlan(dimensions);
  };

  return (
    <div className="input-section">
      <h2>スペースの寸法 (mm)</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="height">高さ</label>
          <input
            type="number"
            id="height"
            name="height"
            value={dimensions.height}
            onChange={handleChange}
            min="1"
          />
        </div>
        <div className="form-field">
          <label htmlFor="width">幅</label>
          <input
            type="number"
            id="width"
            name="width"
            value={dimensions.width}
            onChange={handleChange}
            min="1"
          />
        </div>
        <div className="form-field">
          <label htmlFor="depth">奥行き</label>
          <input
            type="number"
            id="depth"
            name="depth"
            value={dimensions.depth}
            onChange={handleChange}
            min="1"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="create-plan-button">
          プラン作成
        </button>
      </form>
      <style>{`
        .input-section form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-field {
          display: grid;
          grid-template-columns: 80px 1fr;
          align-items: center;
          gap: 0.5rem;
          text-align: left;
        }
        .form-field label {
          font-weight: bold;
        }
        .form-field input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
        }
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
        .error-message {
          color: red;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default SizeInputForm;
