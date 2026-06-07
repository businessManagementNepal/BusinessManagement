type GetSafeModalMaxHeightParams = {
  windowHeight: number;
  topInset: number;
  bottomInset: number;
  topGap?: number;
};

export function getSafeModalMaxHeight({
  windowHeight,
  topInset,
  bottomInset,
  topGap = 12,
}: GetSafeModalMaxHeightParams): number {
  return Math.max(windowHeight - topInset - bottomInset - topGap, 0);
}
