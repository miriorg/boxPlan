// boxPlan/src/components/EditDialog.tsx

import { useState } from 'react';
import type { Box, Plan, PlacedBox } from '../utils/planning'; // Box, Plan, PlacedBox をインポート

interface SelectedBoxInfo {
  boxId: string;
  row: number;
  col: number;
  planIndex: number;
  currentBoxDetails: Box | undefined;
}

interface EditDialogProps {
  selectedBoxInfo: SelectedBoxInfo;
  allBoxes: Box[];
  currentPlan: Plan; // 編集対象のプラン全体
  onClose: () => void;
  onUpdatePlan: (planIndex: number, newBoxId: string, targetRow: number, targetCol: number) => void;
}

const EditDialog = ({ selectedBoxInfo, allBoxes, currentPlan, onClose, onUpdatePlan }: EditDialogProps): JSX.Element => {
  const [selectedNewBoxId, setSelectedNewBoxId] = useState<string | undefined>(selectedBoxInfo.boxId);

  if (!selectedBoxInfo.currentBoxDetails) {
    return null; // ボックスの詳細がない場合は表示しない
  }

  const { manufacturer, depth } = selectedBoxInfo.currentBoxDetails;

  // 同じメーカー、同じ奥行きのボックスをフィルタリング
  const availableBoxes = allBoxes.filter(box =>
    box.manufacturer === manufacturer && box.depth === depth
  );

  const handleUpdate = () => {
    if (selectedNewBoxId && selectedNewBoxId !== selectedBoxInfo.boxId) {
      onUpdatePlan(selectedBoxInfo.planIndex, selectedNewBoxId, selectedBoxInfo.row, selectedBoxInfo.col);
    }
    onClose();
  };

  return (
    <div className="edit-dialog-overlay">
      <div className="edit-dialog-content">
        <h3>ボックスを編集</h3>
        <p>選択中のボックス: {selectedBoxInfo.currentBoxDetails.name}</p>
        <p>メーカー: {manufacturer}</p>
        <p>奥行き: {depth}mm</p>

        <div className="form-field">
          <label htmlFor="newBox">新しいボックスを選択:</label>
          <select
            id="newBox"
            value={selectedNewBoxId}
            onChange={(e) => setSelectedNewBoxId(e.target.value)}
          >
            {availableBoxes.map(box => (
              <option key={box.id} value={box.id}>
                {box.name} (H:{box.height}mm, W:{box.width}mm)
              </option>
            ))}
          </select>
        </div>

        <div className="dialog-actions">
          <button onClick={handleUpdate}>更新</button>
          <button onClick={onClose}>キャンセル</button>
        </div>
      </div>

      <style>{`
        .edit-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }
        .edit-dialog-content {
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          min-width: 300px;
          max-width: 90%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .edit-dialog-content h3 {
          color: var(--text-color);
          margin-top: 0;
        }
        .edit-dialog-content p {
          margin: 0.5rem 0;
        }
        .edit-dialog-content .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .edit-dialog-content select {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
        }
        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }
        .dialog-actions button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .dialog-actions button:first-child {
          background-color: var(--primary-color);
          color: white;
        }
        .dialog-actions button:first-child:hover {
          background-color: var(--secondary-color);
        }
        .dialog-actions button:last-child {
          background-color: var(--border-color);
          color: var(--text-color);
        }
      `}</style>
    </div>
  );
};

export default EditDialog;
