// boxPlan/src/App.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import App from './App';
import { allBoxes } from './data/boxData';

describe('App', () => {
  it('初期レンダリングでスペース寸法入力フォームが表示されること', () => {
    render(<App />);
    expect(screen.getByText('スペースの寸法 (mm)')).toBeInTheDocument();
    expect(screen.getByLabelText('高さ')).toBeInTheDocument();
    expect(screen.getByLabelText('幅')).toBeInTheDocument();
    expect(screen.getByLabelText('奥行き')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '開始' })).toBeInTheDocument();
  });

  it('プラン作成ボタンクリックでプランが表示されること (有効な入力)', async () => {
    // DimensionInput内のボタン操作をモック化またはシミュレートする必要があるため、
    // このテストはより複雑になります。ここでは入力値がデフォルトで有効であると仮定して進めます。
    const user = userEvent.setup();
    render(<App />);

    // デフォルト値が入力されていることを確認
    const heightInput = screen.getByLabelText('高さ');
    const widthInput = screen.getByLabelText('幅');
    const depthInput = screen.getByLabelText('奥行き');
    const createPlanButton = screen.getByRole('button', { name: '開始' });

    expect(heightInput).toHaveValue(1000);
    expect(widthInput).toHaveValue(1200);
    expect(depthInput).toHaveValue(550);

    await user.click(createPlanButton);

    // プラン結果が表示されることを確認
    expect(screen.getByText('提案プラン')).toBeInTheDocument();
    expect(screen.getAllByText(/プラン \d \(.*\)/)).toHaveLength(3); // 3つのプランが表示されることを想定
  });

  it('無効な入力（最小サイズ未満）で開始ボタンが無効化されること', async () => {
    const user = userEvent.setup();
    render(<App />);

    const MIN_BOX_SIZE = Math.min(
      ...allBoxes.flatMap(box => [box.height, box.width, box.depth])
    );

    const heightInput = screen.getByLabelText('高さ');
    const startButton = screen.getByRole('button', { name: '開始' });

    // 初期状態ではボタンは有効
    expect(startButton).not.toBeDisabled();

    // 高さを最小サイズ未満にする
    await user.clear(heightInput);
    await user.type(heightInput, (MIN_BOX_SIZE - 1).toString());

    // ボタンが無効化されることを確認
    await waitFor(() => {
      expect(startButton).toBeDisabled();
    });
  });
});
