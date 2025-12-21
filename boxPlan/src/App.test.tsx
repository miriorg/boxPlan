// boxPlan/src/App.test.tsx
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('初期レンダリングでスペース寸法入力フォームが表示されること', () => {
    render(<App />);
    expect(screen.getByText('スペースの寸法 (mm)')).toBeInTheDocument();
    expect(screen.getByLabelText('高さ')).toBeInTheDocument();
    expect(screen.getByLabelText('幅')).toBeInTheDocument();
    expect(screen.getByLabelText('奥行き')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'プラン作成' })).toBeInTheDocument();
  });

  it('プラン作成ボタンクリックでプランが表示されること (有効な入力)', async () => {
    const user = userEvent.setup();
    render(<App />);

    // デフォルト値が入力されていることを確認
    const heightInput = screen.getByLabelText('高さ');
    const widthInput = screen.getByLabelText('幅');
    const depthInput = screen.getByLabelText('奥行き');
    const createPlanButton = screen.getByRole('button', { name: 'プラン作成' });

    expect(heightInput).toHaveValue(1000);
    expect(widthInput).toHaveValue(1200);
    expect(depthInput).toHaveValue(550);

    await user.click(createPlanButton);

    // プラン結果が表示されることを確認
    expect(screen.getByText('提案プラン')).toBeInTheDocument();
    expect(screen.getAllByText(/プラン \d \(.*\)/)).toHaveLength(3); // 3つのプランが表示されることを想定
  });

  it.skip('無効な入力でプラン作成ボタンをクリックするとエラーメッセージが表示されること', async () => {
    const user = userEvent.setup();
    render(<App />);

    const heightInput = screen.getByLabelText('高さ');
    const createPlanButton = screen.getByRole('button', { name: 'プラン作成' });

    await user.clear(heightInput);
    // fireEvent.change を使用して値を '0' に設定
    fireEvent.change(heightInput, { target: { value: '0' } });
    
    // input type="number" with min="1" will clamp '0' to '1' in browser behavior.
    // So, we expect it to be 1 if min attribute is respected by JSDOM/userEvent simulation
    // or 0 if fireEvent.change bypasses it.
    // We expect 0 as fireEvent.change should bypass min attribute.
    expect(heightInput).toHaveValue(0);

    await act(async () => {
      await user.click(createPlanButton);
    });

    // ここで waitFor を使用してエラーメッセージが表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText('すべての寸法に正の値を入力してください。')).toBeInTheDocument();
    });
    expect(screen.queryByText('提案プラン')).not.toBeInTheDocument(); // プランは表示されない
  });
});
