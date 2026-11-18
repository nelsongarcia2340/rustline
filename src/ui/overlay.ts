import { createWorld, type World } from '../sim/world';

export interface Overlay {
  update(world: World): void;
}

export function createOverlay(container: HTMLElement, onRestart: (world: World) => void): Overlay {
  const root = document.createElement('div');
  root.className = 'overlay hidden';

  const message = document.createElement('div');
  message.className = 'overlay-message';
  root.appendChild(message);

  const restartBtn = document.createElement('button');
  restartBtn.className = 'restart-btn';
  restartBtn.textContent = 'Restart';
  restartBtn.addEventListener('click', () => {
    onRestart(createWorld());
    root.classList.add('hidden');
  });
  root.appendChild(restartBtn);

  container.appendChild(root);

  function update(world: World): void {
    if (world.status === 'playing') {
      root.classList.add('hidden');
      return;
    }
    message.textContent = world.status === 'won' ? 'Victory!' : 'Defeat';
    root.classList.remove('hidden');
  }

  return { update };
}
