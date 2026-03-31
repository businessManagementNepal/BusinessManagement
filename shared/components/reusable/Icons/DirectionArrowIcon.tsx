import React from "react";
import Svg, { Path } from "react-native-svg";

type DirectionArrowIconProps = {
  variant?: "trend-receive" | "trend-pay" | "corner-receive" | "corner-pay";
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function DirectionArrowIcon({
  variant = "corner-receive",
  size = 8,
  color = "#6b7280",
  strokeWidth = 2,
}: DirectionArrowIconProps) {
  const isTrendReceive = variant === "trend-receive";
  const isTrendPay = variant === "trend-pay";
  const isCornerPay = variant === "corner-pay";

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {isTrendReceive ? (
        <>
          <Path
            d="M4 15L9 10L12 13L19 6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 6H19V11"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : isTrendPay ? (
        <>
          <Path
            d="M4 8L9 13L12 10L19 17"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 17H19V12"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : isCornerPay ? (
        <>
          <Path
            d="M7 17L17 7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M7 7H17V17"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <Path
            d="M17 7L7 17"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M17 17H7V7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
}
