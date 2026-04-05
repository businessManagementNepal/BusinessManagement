import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";

type AnimatedSplashScreenProps = {
  onFinish: () => void;
};

type Point = {
  x: number;
  y: number;
};

type Geometry = {
  cx: number;
  cy: number;
  ePts: Point[];
  lPts: Point[];
  eTrav: Point[];
  lTrav: Point[];
  eAll: Point[];
  lAll: Point[];
  eTravLen: number;
  lTravLen: number;
};

type TrailSegment = {
  d: string;
  frac: number;
};

const BG = "#2D6A4F";
const TOTAL_MS = 4200;
const TAGLINE_FADE_MS = 1000;
const FINISH_MS = TOTAL_MS + TAGLINE_FADE_MS;

const T_LETTER = 0.72;
const T_CIRCLE_END = 0.84;
const T_WM_START = 0.81;
const T_WM_END = 0.96;
const T_TAG = 0.97;
const TRAIL_WINDOW = 52;

const LOGO_RADIUS = 56;
const LETTER_STROKE_WIDTH = 8.5;
const DOT_GLOW_RADIUS = 6;
const DOT_CORE_RADIUS = 1;
const WORDMARK = "e-Lekha";
const TAGLINE = "SMART BUSINESS. CLEAR ACCOUNTS.";

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

const easeInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeOut3 = (t: number): number => 1 - Math.pow(1 - t, 3);

const easeOutQ = (t: number): number => 1 - (1 - t) * (1 - t);

const lerp = (start: number, end: number, t: number): number =>
  start + (end - start) * t;

const buildE = (cx: number, cy: number): Point[] => {
  const ex = cx - 19;
  const ey = cy + 3;
  const rw = 17;
  const rh = 16;
  const points: Point[] = [];

  for (let index = 0; index <= 30; index += 1) {
    const t = index / 30;
    points.push({ x: ex - rw + 2 * rw * t, y: ey });
  }

  const steps = 120;
  const arcSpan = 2 * Math.PI - 0.65;
  for (let index = 1; index <= steps; index += 1) {
    const t = index / steps;
    const angle = arcSpan * t;
    points.push({
      x: ex + rw * Math.cos(angle),
      y: ey - rh * Math.sin(angle),
    });
  }

  return points;
};

const buildL = (cx: number, cy: number): Point[] => {
  const lx = cx + 8;
  const lTop = cy - 22;
  const lBottom = cy + 22;
  const lRight = lx + 26;
  const points: Point[] = [];

  for (let index = 0; index <= 40; index += 1) {
    const t = index / 40;
    points.push({ x: lx, y: lerp(lTop, lBottom, t) });
  }

  for (let index = 1; index <= 24; index += 1) {
    const t = index / 24;
    points.push({ x: lerp(lx, lRight, t), y: lBottom });
  }

  return points;
};

const buildTravel = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  fromLeft: boolean,
  steps: number,
  height: number,
): Point[] => {
  const points: Point[] = [];

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const eased = easeOut3(t);
    const x = lerp(startX, endX, eased);
    const waveAmplitude = height * 0.13 * (1 - Math.pow(t, 1.6));
    const wavePhase = fromLeft ? 0 : Math.PI;
    const wave = Math.sin(t * Math.PI * 2.4 + wavePhase) * waveAmplitude;

    points.push({
      x,
      y: lerp(startY, endY, eased) + wave,
    });
  }

  return points;
};

const buildGeometry = (width: number, height: number): Geometry => {
  const cx = width / 2;
  const cy = height / 2 - 82;

  const ePts = buildE(cx, cy);
  const lPts = buildL(cx, cy);

  const lStart = lPts[0];
  const eTrav = buildTravel(
    -20,
    cy - height * 0.06,
    lStart.x,
    lStart.y,
    true,
    90,
    height,
  );

  const eStart = ePts[0];
  const lTrav = buildTravel(
    width + 20,
    cy + height * 0.06,
    eStart.x,
    eStart.y,
    false,
    90,
    height,
  );

  const eAll = [...eTrav, ...lPts];
  const lAll = [...lTrav, ...ePts];

  return {
    cx,
    cy,
    ePts,
    lPts,
    eTrav,
    lTrav,
    eAll,
    lAll,
    eTravLen: eTrav.length,
    lTravLen: lTrav.length,
  };
};

const buildTrailSegments = (
  points: Point[],
  fromIndex: number,
  toIndex: number,
): TrailSegment[] => {
  if (toIndex - fromIndex < 2) {
    return [];
  }

  const segments: TrailSegment[] = [];
  const span = toIndex - fromIndex;

  for (let index = fromIndex + 1; index <= toIndex; index += 1) {
    const previousPoint = points[index - 1];
    const currentPoint = points[index];
    if (!previousPoint || !currentPoint) {
      continue;
    }

    segments.push({
      d: `M${previousPoint.x.toFixed(2)} ${previousPoint.y.toFixed(2)} L${currentPoint.x.toFixed(2)} ${currentPoint.y.toFixed(2)}`,
      frac: (index - fromIndex) / span,
    });
  }

  return segments;
};

const buildStrokePath = (points: Point[], maxCount: number): string => {
  const count = Math.max(0, Math.min(points.length, maxCount));
  if (count < 2) {
    return "";
  }

  const firstPoint = points[0];
  let d = `M${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`;

  for (let index = 1; index < count; index += 1) {
    const point = points[index];
    if (!point) {
      continue;
    }
    d += ` L${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }

  return d;
};

export function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const { width, height } = useWindowDimensions();
  const geometry = useMemo(() => buildGeometry(width, height), [height, width]);

  const [elapsedMs, setElapsedMs] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    const frame = (timestamp: number) => {
      if (startedAtRef.current === null) {
        startedAtRef.current = timestamp;
      }

      const elapsed = timestamp - startedAtRef.current;
      setElapsedMs(Math.min(elapsed, FINISH_MS + 220));

      if (elapsed < FINISH_MS + 220) {
        animationFrameRef.current = requestAnimationFrame(frame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(frame);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      startedAtRef.current = null;
    };
  }, [height, width]);

  useEffect(() => {
    if (hasFinishedRef.current || elapsedMs < FINISH_MS + 120) {
      return;
    }

    hasFinishedRef.current = true;
    onFinish();
  }, [elapsedMs, onFinish]);

  const globalProgress = clamp01(elapsedMs / TOTAL_MS);
  const phase = Math.min(globalProgress / T_LETTER, 1);
  const letterProgress = easeInOut(phase);

  const eIndex = Math.min(
    Math.floor(letterProgress * (geometry.eAll.length - 1)),
    geometry.eAll.length - 1,
  );
  const lIndex = Math.min(
    Math.floor(letterProgress * (geometry.lAll.length - 1)),
    geometry.lAll.length - 1,
  );

  const eTrail = useMemo(
    () =>
      buildTrailSegments(
        geometry.eAll,
        Math.max(0, eIndex - TRAIL_WINDOW),
        eIndex,
      ),
    [eIndex, geometry.eAll],
  );
  const lTrail = useMemo(
    () =>
      buildTrailSegments(
        geometry.lAll,
        Math.max(0, lIndex - TRAIL_WINDOW),
        lIndex,
      ),
    [geometry.lAll, lIndex],
  );

  const eDot = geometry.eAll[Math.max(0, Math.min(eIndex, geometry.eAll.length - 1))];
  const lDot = geometry.lAll[Math.max(0, Math.min(lIndex, geometry.lAll.length - 1))];

  const dotOpacity = phase < 0.96 ? 1 : clamp01(1 - (phase - 0.96) / 0.04);

  const lLiveCount =
    eIndex > geometry.eTravLen
      ? Math.min(eIndex - geometry.eTravLen, geometry.lPts.length)
      : 0;
  const eLiveCount =
    lIndex > geometry.lTravLen
      ? Math.min(lIndex - geometry.lTravLen, geometry.ePts.length)
      : 0;

  const lLivePath = useMemo(
    () => buildStrokePath(geometry.lPts, lLiveCount),
    [geometry.lPts, lLiveCount],
  );
  const eLivePath = useMemo(
    () => buildStrokePath(geometry.ePts, eLiveCount),
    [eLiveCount, geometry.ePts],
  );

  const lFinalPath = useMemo(
    () => buildStrokePath(geometry.lPts, geometry.lPts.length),
    [geometry.lPts],
  );
  const eFinalPath = useMemo(
    () => buildStrokePath(geometry.ePts, geometry.ePts.length),
    [geometry.ePts],
  );

  const finalLetterOpacity =
    globalProgress >= T_LETTER ? clamp01((globalProgress - T_LETTER) / 0.05) : 0;

  const circleOpacity =
    globalProgress >= T_LETTER
      ? easeOut3(clamp01((globalProgress - T_LETTER) / (T_CIRCLE_END - T_LETTER))) *
        0.6
      : 0;

  const wordmarkProgress =
    globalProgress >= T_WM_START
      ? easeOutQ(clamp01((globalProgress - T_WM_START) / (T_WM_END - T_WM_START)))
      : 0;

  const wordmarkReveal = wordmarkProgress * (WORDMARK.length + 1);
  const taglineStartMs = TOTAL_MS * T_TAG;
  const taglineOpacity =
    elapsedMs < taglineStartMs
      ? 0
      : clamp01((elapsedMs - taglineStartMs) / TAGLINE_FADE_MS);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(220,255,235,1)" />
            <Stop offset="30%" stopColor="rgba(80,210,130,0.55)" />
            <Stop offset="100%" stopColor="rgba(45,106,79,0)" />
          </RadialGradient>
        </Defs>

        {eTrail.map((segment, index) => (
          <Path
            key={`e-trail-dark-${index}`}
            d={segment.d}
            stroke={`rgba(50,180,95,${(segment.frac * 0.9).toFixed(3)})`}
            strokeWidth={11}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {eTrail.map((segment, index) => (
          <Path
            key={`e-trail-core-${index}`}
            d={segment.d}
            stroke={`rgba(200,255,220,${(segment.frac * 0.4).toFixed(3)})`}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {lTrail.map((segment, index) => (
          <Path
            key={`l-trail-dark-${index}`}
            d={segment.d}
            stroke={`rgba(50,180,95,${(segment.frac * 0.9).toFixed(3)})`}
            strokeWidth={11}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {lTrail.map((segment, index) => (
          <Path
            key={`l-trail-core-${index}`}
            d={segment.d}
            stroke={`rgba(200,255,220,${(segment.frac * 0.4).toFixed(3)})`}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {lLivePath ? (
          <Path
            d={lLivePath}
            stroke="rgba(255,255,255,1)"
            strokeWidth={LETTER_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
        {eLivePath ? (
          <Path
            d={eLivePath}
            stroke="rgba(255,255,255,1)"
            strokeWidth={LETTER_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}

        {finalLetterOpacity > 0 ? (
          <Path
            d={lFinalPath}
            stroke={`rgba(255,255,255,${finalLetterOpacity.toFixed(3)})`}
            strokeWidth={LETTER_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
        {finalLetterOpacity > 0 ? (
          <Path
            d={eFinalPath}
            stroke={`rgba(255,255,255,${finalLetterOpacity.toFixed(3)})`}
            strokeWidth={LETTER_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}

        {circleOpacity > 0 ? (
          <Circle
            cx={geometry.cx}
            cy={geometry.cy}
            r={LOGO_RADIUS + 5}
            stroke={`rgba(255,255,255,${(circleOpacity * 0.22).toFixed(3)})`}
            strokeWidth={3}
            fill="none"
          />
        ) : null}

        <Circle
          cx={eDot.x}
          cy={eDot.y}
          r={DOT_GLOW_RADIUS}
          fill="url(#dotGlow)"
          opacity={dotOpacity}
        />
        <Circle
          cx={eDot.x}
          cy={eDot.y}
          r={DOT_CORE_RADIUS}
          fill={`rgba(235,255,245,${dotOpacity.toFixed(3)})`}
        />

        <Circle
          cx={lDot.x}
          cy={lDot.y}
          r={DOT_GLOW_RADIUS}
          fill="url(#dotGlow)"
          opacity={dotOpacity}
        />
        <Circle
          cx={lDot.x}
          cy={lDot.y}
          r={DOT_CORE_RADIUS}
          fill={`rgba(235,255,245,${dotOpacity.toFixed(3)})`}
        />
      </Svg>

      <View style={[styles.below, { top: height / 2 + 168 }]}>
        <View style={styles.wordmarkRow}>
          {WORDMARK.split("").map((character, index) => {
            const charProgress = clamp01(wordmarkReveal - index);
            return (
              <Text
                key={`wordmark-char-${index}`}
                style={[
                  styles.wordmarkChar,
                  {
                    opacity: easeOutQ(charProgress),
                    marginRight: index === WORDMARK.length - 1 ? 0 : 4,
                  },
                ]}
              >
                {character}
              </Text>
            );
          })}
        </View>
        <Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          {TAGLINE}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
  },
  below: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 3,
    alignItems: "center",
  },
  wordmarkRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
  },
  wordmarkChar: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 30,
    lineHeight: 36,
    fontFamily: "InterRegular",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  tagline: {
    marginTop: 14,
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 3,
    fontFamily: "InterRegular",
  },
});
