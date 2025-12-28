import React, { useState } from 'react';

interface DimensionInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const DimensionInput: React.FC<DimensionInputProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
}) => {
  // 選択中の増減ステップ（デフォルト100）
  const [step, setStep] = useState<number>(100);

  const steps = [1000, 500, 100, 50, 10];

  const handleAdd = () => {
    onChange(value + step);
  };

  const handleSubtract = () => {
    const newValue = value - step;
    // 計算結果が1未満の時は1に補正
    onChange(newValue < 1 ? 1 : newValue);
  };

  const handleReset = () => {
    // リセット時は0（初期化）
    onChange(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    // isNaNまたは空文字の場合は0として扱う
    onChange(isNaN(val) ? 0 : val);
  };

  // スタイル定義
  const styles: { [key: string]: React.CSSProperties | ((isActive: boolean) => React.CSSProperties) } = {
    container: {
      marginBottom: '1rem',
      padding: '1rem',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      border: '1px solid #dfdfdf',
    },
    labelRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1rem',
    },
    label: {
      fontWeight: 'bold' as const,
      minWidth: '50px'
    },
    input: {
      padding: '0.5rem',
      fontSize: '1.1rem',
      width: '120px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      textAlign: 'right' as const,
    },
    buttonGroup: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '0.5rem',
      marginBottom: '0.5rem',
    },
    stepButton: (isActive: boolean) => ({
      padding: '0.25rem 0.75rem',
      backgroundColor: isActive ? '#64BCFC' : '#dfdfdf',
      color: isActive ? '#fff' : '#454545',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
    }),
    actionButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#fff',
      border: '1px solid #64BCFC',
      color: '#64BCFC',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold' as const,
      minWidth: '40px',
      textAlign: 'center' as const,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.labelRow}>
        <label htmlFor={id} style={styles.label}>{label}</label>
        <input id={id} type="number" value={value} onChange={handleInputChange} disabled={disabled} min={0} style={styles.input} />
        <span>mm</span>
      </div>

      <div style={styles.buttonGroup}>
        {steps.map((s) => (
          <button key={s} onClick={() => setStep(s)} disabled={disabled} style={styles.stepButton(step === s)}>{s}</button>
        ))}
      </div>

      <div style={styles.buttonGroup}>
        <button onClick={handleSubtract} disabled={disabled} style={styles.actionButton}>－</button>
        <button onClick={handleAdd} disabled={disabled} style={styles.actionButton}>＋</button>
        <button onClick={handleReset} disabled={disabled} style={{...styles.actionButton, marginLeft: 'auto'}}>リセット</button>
      </div>
    </div>
  );
};