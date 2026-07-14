export interface ProjectCover {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export const CASMD_COVER = {
  src: '/stitch/casmd-cartoon.png',
  alt: 'Hand-drawn CasMD molecular dynamics illustration of a protein–nucleic acid complex',
  width: 1024,
  height: 576,
} as const satisfies ProjectCover;
