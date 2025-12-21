import { serializePlan, deserializePlan, type UserInput, type PlanResult } from './share';

/**
 * URL共有機能（シリアライズ/デシリアライズ）の動作検証テスト
 * アプリケーションの適当な場所（App.tsxなど）で一度だけ呼び出して使用します。
 */
export const runShareTests = () => {
  console.group('🧪 Share Functionality Tests');

  try {
    // 共通の入力データ
    const input: UserInput = { height: 1000, width: 1000, depth: 300 };

    // Test Case 1: 基本データ
    const plan1: PlanResult = {
      boxes: [
        { manufacturer: 'TestMaker', name: 'BoxA', height: 100, width: 100, depth: 300, count: 1 }
      ]
    };

    const encoded1 = serializePlan(input, plan1);
    const decoded1 = deserializePlan(encoded1);

    const isMatch1 = JSON.stringify({ input, plan: plan1 }) === JSON.stringify(decoded1);
    console.log(isMatch1 ? '✅ Test 1 (Basic): PASS' : '❌ Test 1 (Basic): FAIL');
    if (!isMatch1) console.error('Expected:', { input, plan: plan1 }, 'Got:', decoded1);

    // Test Case 2: 日本語データ（マルチバイト文字対応確認）
    const plan2: PlanResult = {
      boxes: [
        { manufacturer: '無印良品', name: '衣装ケース・ワイド', height: 180, width: 400, depth: 650, count: 2 }
      ]
    };

    const encoded2 = serializePlan(input, plan2);
    const decoded2 = deserializePlan(encoded2);

    const isMatch2 = JSON.stringify({ input, plan: plan2 }) === JSON.stringify(decoded2);
    console.log(isMatch2 ? '✅ Test 2 (Japanese): PASS' : '❌ Test 2 (Japanese): FAIL');
    if (!isMatch2) console.error('Expected:', { input, plan: plan2 }, 'Got:', decoded2);

  } catch (e) {
    console.error('❌ Test Execution Error:', e);
  } finally {
    console.groupEnd();
  }
};