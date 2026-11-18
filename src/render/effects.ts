import type { Side } from '../data/units';
import type { AttackEvent } from '../sim/combat';

export type EffectKind = 'projectile' | 'impact' | 'burst';

export interface Effect {
  kind: EffectKind;
  side: Side;
  fromX: number;
  toX: number;
  startMs: number;
}

export const EFFECT_DURATION_MS: Record<EffectKind, number> = {
  projectile: 150,
  impact: 120,
  burst: 220,
};

const RANGED_THRESHOLD = 150;

function classify(event: AttackEvent): EffectKind {
  if (event.splashRadius > 0) return 'burst';
  if (event.range >= RANGED_THRESHOLD) return 'projectile';
  return 'impact';
}

export interface EffectsTracker {
  absorb(events: AttackEvent[], nowMs: number): void;
  active(nowMs: number): Effect[];
}

export function createEffectsTracker(): EffectsTracker {
  let effects: Effect[] = [];

  return {
    absorb(events, nowMs) {
      for (const event of events) {
        effects.push({
          kind: classify(event),
          side: event.attackerSide,
          fromX: event.attackerX,
          toX: event.targetX,
          startMs: nowMs,
        });

        if (event.killed) {
          effects.push({
            kind: 'burst',
            side: event.attackerSide,
            fromX: event.targetX,
            toX: event.targetX,
            startMs: nowMs,
          });
        }
      }
    },

    active(nowMs) {
      effects = effects.filter((effect) => nowMs - effect.startMs < EFFECT_DURATION_MS[effect.kind]);
      return effects;
    },
  };
}
