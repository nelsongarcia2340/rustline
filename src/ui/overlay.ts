import type { World } from '../sim/world';

export interface Overlay {
  /** Show or hide the overlay to match the world status. Cheap to call every frame. */
  update(status: World['status']): void;
}

/**
 * Win/lose overlay with a Restart button. Restart is triggered by pointerdown on the
 * button or by the R / Enter keys while the overlay is visible.
 */
export function createOverlay(root: HTMLElement, onRestart: () => void): Overlay {
  const panel = document.createElement('div');
  panel.className = 'overlay';
  panel.hidden = true;
  const title = document.createElement('div');
  title.className = 'overlay-title';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'overlay-btn';
  button.textContent = 'Restart';
  const hint = document.createElement('div');
  hint.className = 'overlay-hint';
  hint.textContent = 'or press R / Enter';
  panel.append(title, button, hint);
  root.append(panel);

  let shown: World['status'] = 'playing';

  const restart = (): void => {
    if (shown === 'playing') return;
    onRestart();
  };

  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    restart();
  });
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') {
      e.preventDefault();
      restart();
    }
  });

  return {
    update(status) {
      if (status === shown) return;
      shown = status;
      panel.hidden = status === 'playing';
      panel.dataset.status = status;
      title.textContent = status === 'won' ? 'VICTORY' : status === 'lost' ? 'DEFEAT' : '';
    },
  };
}
