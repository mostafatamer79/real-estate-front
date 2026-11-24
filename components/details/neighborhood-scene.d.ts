import type { DetailsPlace } from '@/lib/details-design';
export interface PinProjection { id: string; x: number; y: number; visible: boolean }
export interface DroneTelemetry {
  state: 'overhead' | 'flying' | 'street';
  altitude: number;
  heading: number;
  speed?: number;
}
export interface NeighborhoodScene {
  draw(): void; dispose(): void; setReducedMotion(value: boolean): void;
  rotate(delta: number): void; reset(): void; zoom(delta: number): void;
  play(value: boolean): void; theme(dark: boolean): void;
  flyToOverview(): void;
  flyToCoordinates(x: number, z: number): void;
  flyToPlace(placeId: string): void;
  startPatrol?(): void;
}
export function createNeighborhoodScene(host: HTMLDivElement, project: (pins: PinProjection[]) => void,
  options: {
    places: DetailsPlace[];
    reducedMotion: boolean;
    dark: boolean;
    propertyEntry?: boolean;
    onPlayingChange?: (playing: boolean) => void;
    onDroneStateChange?: (telemetry: DroneTelemetry) => void;
  }): NeighborhoodScene;
