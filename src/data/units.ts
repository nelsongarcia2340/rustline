export type Side = 'player' | 'enemy';

export interface UnitDef {
  id: string;
  side: Side;
  name: string;
  /** Energy cost to deploy (0 for enemy units). */
  cost: number;
  /** Deploy cooldown in seconds (0 for enemy units). */
  cooldownSec: number;
  hp: number;
  dmg: number;
  range: number;
  speed: number;
  attackIntervalSec: number;
  /** Splash radius in world units; 0 means single target. */
  splashRadius: number;
}

export const PLAYER_ROSTER: UnitDef[] = [
  { id: 'scrapper', side: 'player', name: 'Scrapper', cost: 50, cooldownSec: 2, hp: 120, dmg: 12, range: 30, speed: 60, attackIntervalSec: 0.8, splashRadius: 0 },
  { id: 'bolt-gunner', side: 'player', name: 'Bolt-Gunner', cost: 100, cooldownSec: 4, hp: 90, dmg: 18, range: 220, speed: 45, attackIntervalSec: 1.2, splashRadius: 0 },
  { id: 'bulwark', side: 'player', name: 'Bulwark', cost: 150, cooldownSec: 8, hp: 500, dmg: 10, range: 30, speed: 35, attackIntervalSec: 1.5, splashRadius: 0 },
  { id: 'sprinter', side: 'player', name: 'Sprinter', cost: 120, cooldownSec: 6, hp: 150, dmg: 25, range: 30, speed: 140, attackIntervalSec: 0.7, splashRadius: 0 },
  { id: 'titan', side: 'player', name: 'Titan', cost: 400, cooldownSec: 25, hp: 900, dmg: 60, range: 90, speed: 30, attackIntervalSec: 3.0, splashRadius: 90 },
];

export const ENEMY_ROSTER: UnitDef[] = [
  { id: 'rustbot', side: 'enemy', name: 'Rustbot', cost: 0, cooldownSec: 0, hp: 150, dmg: 10, range: 30, speed: 50, attackIntervalSec: 1.0, splashRadius: 0 },
  { id: 'drone', side: 'enemy', name: 'Drone', cost: 0, cooldownSec: 0, hp: 70, dmg: 14, range: 30, speed: 120, attackIntervalSec: 0.7, splashRadius: 0 },
  { id: 'turret-walker', side: 'enemy', name: 'Turret-Walker', cost: 0, cooldownSec: 0, hp: 180, dmg: 20, range: 250, speed: 35, attackIntervalSec: 1.4, splashRadius: 0 },
  { id: 'siege-tank', side: 'enemy', name: 'Siege Tank', cost: 0, cooldownSec: 0, hp: 800, dmg: 45, range: 50, speed: 28, attackIntervalSec: 2.0, splashRadius: 0 },
  { id: 'overseer', side: 'enemy', name: 'Overseer', cost: 0, cooldownSec: 0, hp: 2000, dmg: 50, range: 120, speed: 20, attackIntervalSec: 3.0, splashRadius: 120 },
];

const DEFS_BY_ID = new Map<string, UnitDef>(
  [...PLAYER_ROSTER, ...ENEMY_ROSTER].map((d) => [d.id, d]),
);

export function getDef(id: string): UnitDef {
  const def = DEFS_BY_ID.get(id);
  if (!def) throw new Error(`Unknown unit id: ${id}`);
  return def;
}
