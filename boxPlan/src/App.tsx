import { useState, useEffect } from 'react';
import './App.css';
import SizeInputForm from './components/SizeInputForm';
import PlanResults from './components/PlanResults';
import EditDialog from './components/EditDialog'; // 追加
import { boxData } from './boxData.js';
import { createPlans, Plan, Dimensions, Box, PlacedBox, encodePlanToString, decodeStringToPlan } from './utils/planning'; // エンコード/デコード関数もインポート

interface SelectedBoxInfo {
  boxId: string;
  row: number;
  col: number;
  planIndex: number;
  currentBoxDetails: Box | undefined; // 選択されたボックスの詳細情報
}

function App(): JSX.Element {
  const [spaceDimensions, setSpaceDimensions] = useState<Dimensions | null>(null); // スペースの寸法もstateで管理
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selectedBoxInfo, setSelectedBoxInfo] = useState<SelectedBoxInfo | null>(null);
  const [heightExceededError, setHeightExceededError] = useState<string | null>(null); // 高さ超過エラー

  // URLからプランをデコードして初期表示
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedPlan = params.get('plan');
    if (encodedPlan) {
      console.log("Decoding plan from URL:", encodedPlan);
      const decodedPlan = decodeStringToPlan(encodedPlan, boxData);
      if (decodedPlan) {
        setPlans([decodedPlan]);
        // デコードされたプランを表示する場合、元のスペース寸法は不明なので入力フォームは初期値のまま
        // または、デコードされたプランから逆算してスペース寸法を設定するロジックが必要
        // 現状ではスペース寸法はnullのまま、またはhandleCreatePlanを呼んで再計算させる
      }
    }
  }, []); // 初回マウント時のみ実行

  // plans の変更を監視し、URLを更新
  useEffect(() => {
    if (plans && plans.length > 0) {
      // 共有するプランは1つ目のプランと仮定（複数プランの場合はどのプランを共有するか選択が必要）
      const encoded = encodePlanToString(plans[0]);
      const newUrl = `${window.location.origin}${window.location.pathname}?plan=${encoded}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      console.log("URL updated:", newUrl);
    }
  }, [plans]); // plans が変更されたときに実行

  const handleCreatePlan = (dimensions: Dimensions) => {
    console.log('Creating plan with dimensions:', dimensions);
    setSpaceDimensions(dimensions); // スペースの寸法を保存
    const newPlans = createPlans(dimensions, boxData);
    setPlans(newPlans);
    setSelectedBoxInfo(null); // 新しいプラン作成時は選択状態をリセット
    setHeightExceededError(null); // エラーもリセット
  };

  const handleBoxClick = (boxId: string, row: number, col: number, planIndex: number) => {
    const plan = plans ? plans[planIndex] : undefined;
    const currentBox = plan?.boxes.find(b => b.boxId === boxId && b.row === row && b.col === col);
    const currentBoxDetails = boxData.find(b => b.id === currentBox?.boxId);
    
    setSelectedBoxInfo({ boxId, row, col, planIndex, currentBoxDetails });
    console.log('Box clicked:', { boxId, row, col, planIndex, currentBoxDetails });
  };

  const handleCloseEditDialog = () => {
    setSelectedBoxInfo(null);
  };

  const handleUpdatePlan = (planIndex: number, newBoxId: string, targetRow: number, targetCol: number) => {
    if (!plans || !spaceDimensions) return;

    const currentPlan = plans[planIndex];
    const newBox = boxData.find(b => b.id === newBoxId);
    if (!newBox) return;

    let updatedBoxes: PlacedBox[] = [];
    let finalRowHeights = [...currentPlan.rowHeights];
    let finalColWidths = [...currentPlan.colWidths];
    const newBoxTypes = new Set<string>();
    let newPlanVolume = 0;

    // ターゲットの行と列のサイズを新しいボックスのサイズで更新
    finalRowHeights[targetRow] = newBox.height;
    finalColWidths[targetCol] = newBox.width;

    // 全体のボックスを再構築
    // 新しい行と列の高さ/幅に基づいて、既存のボックスデータを再探索し、配置を決定する
    // これは仕様の「行全体と列全体が新しい高さ・幅のボックスに一括で更新される」を厳密に解釈した実装
    for (let r = 0; r < finalRowHeights.length; r++) {
      for (let c = 0; c < finalColWidths.length; c++) {
        const targetH = finalRowHeights[r];
        const targetW = finalColWidths[c];

        // 新しい行/列のサイズに合うボックスを探す
        const boxToAdd = boxData.find(b =>
          b.manufacturer === newBox.manufacturer && // 同じメーカー
          b.depth === newBox.depth &&               // 同じ奥行き
          b.height === targetH &&
          b.width === targetW
        );

        if (boxToAdd) {
          updatedBoxes.push({ boxId: boxToAdd.id, row: r, col: c });
          newBoxTypes.add(boxToAdd.id);
          newPlanVolume += boxToAdd.height * boxToAdd.width * boxToAdd.depth;
        } else {
          // 該当するボックスが見つからない場合、このプランは成立しないと判断
          // または、元のボックスを維持するか、エラーとして処理する
          // ここでは、一旦元のボックスを維持する（ただしこれは仕様の「一括更新」と異なる可能性がある）
          const originalBoxInfo = currentPlan.boxes.find(b => b.row === r && b.col === c);
          if (originalBoxInfo) {
            const originalBox = boxData.find(b => b.id === originalBoxInfo.boxId);
            if (originalBox) {
              updatedBoxes.push({ boxId: originalBox.id, row: r, col: c });
              newBoxTypes.add(originalBox.id);
              newPlanVolume += originalBox.height * originalBox.width * originalBox.depth;
            }
          }
          // 仕様の厳密な解釈によっては、ここでプランを無効とすべきかもしれない。
          // 例：return; またはエラーメッセージを設定。
        }
      }
    }

    // 更新されたプラン情報に基づいて新しいPlanオブジェクトを構築
    const newTotalHeight = finalRowHeights.reduce((sum, h) => sum + h, 0);
    const newTotalWidth = finalColWidths.reduce((sum, w) => sum + w, 0);
    const newUtilization = (spaceDimensions.height * spaceDimensions.width * currentPlan.depth > 0)
      ? (newPlanVolume / (spaceDimensions.height * spaceDimensions.width * currentPlan.depth)) * 100
      : 0;

    const updatedPlan: Plan = {
      ...currentPlan,
      boxes: updatedBoxes,
      rowHeights: finalRowHeights,
      colWidths: finalColWidths,
      totalHeight: newTotalHeight,
      totalWidth: newTotalWidth,
      utilization: newUtilization,
      boxCount: updatedBoxes.length,
      boxTypeCount: newBoxTypes.size,
    };

    // プランを更新
    const updatedPlans = plans.map((plan, idx) => (idx === planIndex ? updatedPlan : plan));
    setPlans(updatedPlans); // plans が更新されると useEffect が発火し、URLも更新される

    // 高さ超過チェック
    if (updatedPlan.totalHeight > spaceDimensions.height) {
      setHeightExceededError(`プラン ${planIndex + 1} の高さ (${updatedPlan.totalHeight}mm) が、指定スペースの高さ (${spaceDimensions.height}mm) を超過しています！`);
    } else {
      setHeightExceededError(null);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Box Planner</h1>
        <p>最適な収納ボックスの組み合わせを見つけよう</p>
      </header>
      <main>
        <SizeInputForm onCreatePlan={handleCreatePlan} />
        {plans ? (
          <PlanResults plans={plans} allBoxes={boxData} onBoxClick={handleBoxClick} />
        ) : (
          <div className="results-section">
            <p>寸法を入力してプランを作成してください。</p>
          </div>
        )}
      </main>
      <footer>
        <p>&copy; 2024 Box Planner</p>
      </footer>

      {heightExceededError && (
        <div className="error-message-banner" style={{ color: 'red', margin: '1rem 0' }}>
          {heightExceededError}
        </div>
      )}

      {selectedBoxInfo && plans && (
        <EditDialog 
          selectedBoxInfo={selectedBoxInfo}
          allBoxes={boxData}
          currentPlan={plans[selectedBoxInfo.planIndex]}
          onClose={handleCloseEditDialog}
          onUpdatePlan={handleUpdatePlan}
        />
      )}
    </div>
  );
}

export default App;