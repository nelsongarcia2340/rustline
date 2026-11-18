export interface StageEvent {
  atSecond: number;
  type: string;
}

export const STAGE_1: StageEvent[] = [
  // Probe: a gentle rustbot trickle to introduce the lane.
  { atSecond: 10, type: 'rustbot' },
  { atSecond: 22, type: 'rustbot' },
  { atSecond: 34, type: 'rustbot' },

  // Lull, then First Rush: rustbot + drone in a tight window.
  { atSecond: 55, type: 'rustbot' },
  { atSecond: 62, type: 'drone' },
  { atSecond: 70, type: 'rustbot' },
  { atSecond: 78, type: 'drone' },
  { atSecond: 85, type: 'rustbot' },

  // Lull, then Ranged Pressure: turret-walker joins.
  { atSecond: 112, type: 'turret-walker' },
  { atSecond: 122, type: 'rustbot' },
  { atSecond: 132, type: 'drone' },
  { atSecond: 142, type: 'turret-walker' },
  { atSecond: 152, type: 'rustbot' },

  // Lull, then Armor Push: siege-tank joins.
  { atSecond: 178, type: 'siege-tank' },
  { atSecond: 188, type: 'rustbot' },
  { atSecond: 196, type: 'drone' },
  { atSecond: 206, type: 'turret-walker' },
  { atSecond: 218, type: 'siege-tank' },

  // Lull, then Escalation: a bigger mixed wave.
  { atSecond: 244, type: 'rustbot' },
  { atSecond: 252, type: 'drone' },
  { atSecond: 262, type: 'turret-walker' },
  { atSecond: 272, type: 'siege-tank' },
  { atSecond: 282, type: 'rustbot' },
  { atSecond: 290, type: 'drone' },
  { atSecond: 302, type: 'turret-walker' },
  { atSecond: 314, type: 'siege-tank' },
  { atSecond: 324, type: 'rustbot' },

  // Lull, then Final Wave: the heaviest surge.
  { atSecond: 354, type: 'rustbot' },
  { atSecond: 362, type: 'drone' },
  { atSecond: 372, type: 'siege-tank' },
  { atSecond: 382, type: 'turret-walker' },
  { atSecond: 392, type: 'rustbot' },
  { atSecond: 400, type: 'drone' },
  { atSecond: 412, type: 'siege-tank' },
  { atSecond: 422, type: 'turret-walker' },
  { atSecond: 432, type: 'rustbot' },

  // Tail trickle for the remainder of the budget.
  { atSecond: 450, type: 'rustbot' },
  { atSecond: 470, type: 'drone' },
  { atSecond: 495, type: 'turret-walker' },
  { atSecond: 520, type: 'rustbot' },
  { atSecond: 545, type: 'drone' },
  { atSecond: 570, type: 'siege-tank' },
];
