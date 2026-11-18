/**
 * A pixel sprite: character grids plus a palette.
 *
 * Every frame is an array of equal-length strings. `.` is transparent; any other
 * character is a key into `palette` (a CSS colour string). All sprites face RIGHT;
 * the renderer flips enemy-side sprites horizontally.
 */
export interface SpriteDef {
  palette: Record<string, string>;
  frames: {
    walk1: string[];
    walk2: string[];
    attack: string[];
  };
}

export type SpriteFrameName = keyof SpriteDef['frames'];
