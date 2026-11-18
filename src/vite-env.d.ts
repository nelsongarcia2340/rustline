/// <reference types="vite/client" />

import type { Camera } from './render/camera';
import type { World } from './sim/world';

declare global {
  interface Window {
    /** Dev-only debug hook (never present in production builds). */
    __game?: {
      readonly world: World;
      readonly camera: Camera;
      deploy(id: string): boolean;
      step(n?: number): void;
    };
  }
}
