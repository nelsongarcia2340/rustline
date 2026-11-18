import { PLAYER_ROSTER } from '../data/units';
import { canDeploy, deploy } from '../sim/economy';
import { TICKS_PER_SEC } from '../sim/constants';
import type { World } from '../sim/world';

export interface Hud {
  update(world: World): void;
}

export function createHud(container: HTMLElement, getWorld: () => World): Hud {
  const root = document.createElement('div');
  root.className = 'hud';

  const energyBar = document.createElement('div');
  energyBar.className = 'energy-bar';
  const energyFill = document.createElement('div');
  energyFill.className = 'energy-fill';
  energyBar.appendChild(energyFill);
  root.appendChild(energyBar);

  const deployBar = document.createElement('div');
  deployBar.className = 'deploy-bar';
  root.appendChild(deployBar);

  const buttons = PLAYER_ROSTER.map((def) => {
    const btn = document.createElement('button');
    btn.className = 'deploy-btn';
    btn.dataset.unitId = def.id;
    btn.innerHTML = `<div class="cooldown-fill"></div><span class="name">${def.name}</span><span class="cost">${def.cost}</span>`;

    const tryDeploy = () => deploy(getWorld(), def.id);
    btn.addEventListener('click', tryDeploy);
    btn.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        tryDeploy();
      },
      { passive: false },
    );

    deployBar.appendChild(btn);
    return { def, btn, cooldownFill: btn.querySelector('.cooldown-fill') as HTMLElement };
  });

  container.appendChild(root);

  function update(world: World): void {
    energyFill.style.width = `${Math.max(0, Math.min(100, (world.energy / 600) * 100))}%`;

    for (const { def, btn, cooldownFill } of buttons) {
      btn.disabled = !canDeploy(world, def.id);
      const remaining = world.cooldowns[def.id] ?? 0;
      const cooldownTicks = Math.round(def.cooldownSec * TICKS_PER_SEC);
      const ratio = cooldownTicks > 0 ? remaining / cooldownTicks : 0;
      cooldownFill.style.height = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
    }
  }

  return { update };
}
