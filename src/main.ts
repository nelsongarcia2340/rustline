import { PLAYER_ROSTER, ENEMY_ROSTER } from './data/units';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const ctx = canvas?.getContext('2d');

if (ctx) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas!.width, canvas!.height);
  ctx.fillStyle = '#5ad';
  ctx.font = '16px monospace';
  ctx.fillText(
    `Rustline scaffold: ${PLAYER_ROSTER.length} player units, ${ENEMY_ROSTER.length} enemy units`,
    20,
    30,
  );
}
