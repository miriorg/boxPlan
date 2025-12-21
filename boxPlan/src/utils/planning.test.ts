// boxPlan/src/utils/planning.test.ts
import { describe, it, expect } from 'vitest';
import { createPlans, encodePlanToString, decodeStringToPlan, Dimensions, Box, Plan } from './planning';
import { boxData, manufacturers } from '../boxData';

// ダミーデータ
const allBoxes: Box[] = boxData;

describe('planning.ts', () => {
  describe('createPlans', () => {
    it('与えられたスペースとボックスデータに基づいてプランを作成する', () => {
      const spaceDimensions: Dimensions = { height: 1000, width: 1200, depth: 550 };
      const plans = createPlans(spaceDimensions, allBoxes);

      expect(plans).toBeDefined();
      expect(plans.length).toBeGreaterThan(0);
      expect(plans[0].utilization).toBeGreaterThan(0);
      expect(plans[0].boxes.length).toBeGreaterThan(0);
    });

    it('depthがspaceDimensions.depthより大きいボックスを除外する', () => {
      const spaceDimensions: Dimensions = { height: 1000, width: 1200, depth: 300 }; // 浅い奥行き
      const plans = createPlans(spaceDimensions, allBoxes);

      // プランに含まれるすべてのボックスの奥行きが300以下であることを確認
      plans.forEach(plan => {
        plan.boxes.forEach(placedBox => {
          const box = allBoxes.find(b => b.id === placedBox.boxId);
          expect(box?.depth).toBeLessThanOrEqual(spaceDimensions.depth);
        });
      });
    });

    it('高さと幅が0のスペースにはプランを作成しない', () => {
      const spaceDimensions: Dimensions = { height: 0, width: 0, depth: 550 };
      const plans = createPlans(spaceDimensions, allBoxes);
      expect(plans.length).toBe(0);
    });

    it('ボックスデータが空の場合、プランを作成しない', () => {
      const spaceDimensions: Dimensions = { height: 1000, width: 1200, depth: 550 };
      const plans = createPlans(spaceDimensions, []);
      expect(plans.length).toBe(0);
    });

    it('プランは活用率でソートされている', () => {
      const spaceDimensions: Dimensions = { height: 1000, width: 1200, depth: 550 };
      const plans = createPlans(spaceDimensions, allBoxes);
      
      if (plans.length > 1) {
        for (let i = 0; i < plans.length - 1; i++) {
          expect(plans[i].utilization).toBeGreaterThanOrEqual(plans[i + 1].utilization);
        }
      }
    });

    it('上位3件のプランのみを返す', () => {
      // 多数のプランが生成される状況を作るために、より小さなスペースとボックスデータを使用
      const smallBoxData: Box[] = [
        { id: 'b1', manufacturer: 'test', name: 'small1', height: 100, width: 100, depth: 100 },
        { id: 'b2', manufacturer: 'test', name: 'small2', height: 100, width: 100, depth: 100 },
        { id: 'b3', manufacturer: 'test', name: 'small3', height: 200, width: 100, depth: 100 },
        { id: 'b4', manufacturer: 'test', name: 'small4', height: 100, width: 200, depth: 100 },
      ];
      const spaceDimensions: Dimensions = { height: 300, width: 300, depth: 100 };
      const plans = createPlans(spaceDimensions, smallBoxData);
      expect(plans.length).toBeLessThanOrEqual(3); // 3つ以下であることを確認
    });
  });

  describe('encodePlanToString & decodeStringToPlan', () => {
    const samplePlan: Plan = {
      id: 'test-plan-001',
      manufacturer: manufacturers.TENMA,
      depth: 530,
      totalHeight: 300,
      totalWidth: 300,
      utilization: 75.5,
      rowHeights: [150, 150],
      colWidths: [150, 150],
      boxes: [
        { boxId: 'tenma-01', row: 0, col: 0 },
        { boxId: 'tenma-02', row: 0, col: 1 },
        { boxId: 'tenma-03', row: 1, col: 0 },
        { boxId: 'tenma-04', row: 1, col: 1 },
      ],
      boxCount: 4,
      boxTypeCount: 4,
    };

    it('プランを文字列にエンコードし、元のプランにデコードできる', () => {
      const encodedString = encodePlanToString(samplePlan);
      expect(encodedString).toBeDefined();
      expect(typeof encodedString).toBe('string');
      expect(encodedString.length).toBeGreaterThan(0);

      const decodedPlan = decodeStringToPlan(encodedString, allBoxes);
      expect(decodedPlan).toBeDefined();
      expect(decodedPlan?.manufacturer).toBe(samplePlan.manufacturer);
      expect(decodedPlan?.depth).toBe(samplePlan.depth);
      expect(decodedPlan?.rowHeights).toEqual(samplePlan.rowHeights);
      expect(decodedPlan?.colWidths).toEqual(samplePlan.colWidths);
      expect(decodedPlan?.boxes.length).toBe(samplePlan.boxes.length);
      
      // `boxes`の中身を比較
      decodedPlan?.boxes.forEach((decodedBox, index) => {
        expect(decodedBox.boxId).toBe(samplePlan.boxes[index].boxId);
        expect(decodedBox.row).toBe(samplePlan.boxes[index].row);
        expect(decodedBox.col).toBe(samplePlan.boxes[index].col);
      });

      // totalHeight, totalWidth, boxCount, boxTypeCount は decodeStringToPlan で再計算されるので元の値と一致しない場合がある
      // utilization は現在デコード時に0になるように実装されているので0であることを確認
      expect(decodedPlan?.utilization).toBe(0);
      expect(decodedPlan?.totalHeight).toBe(samplePlan.totalHeight);
      expect(decodedPlan?.totalWidth).toBe(samplePlan.totalWidth);
      expect(decodedPlan?.boxCount).toBe(samplePlan.boxCount);
      expect(decodedPlan?.boxTypeCount).toBe(samplePlan.boxTypeCount);
    });

    it('無効なエンコード文字列をデコードしようとするとnullを返す', () => {
      const invalidString = 'invalid-encoded-string';
      const decodedPlan = decodeStringToPlan(invalidString, allBoxes);
      expect(decodedPlan).toBeNull();
    });

    it('部分的なデータを持つエンコード文字列をデコードしようとするとnullを返す', () => {
      const partiallyEncoded = btoa(encodeURIComponent(JSON.stringify({ manufacturer: 'test' })));
      const decodedPlan = decodeStringToPlan(partiallyEncoded, allBoxes);
      expect(decodedPlan).toBeNull();
    });
  });
});
