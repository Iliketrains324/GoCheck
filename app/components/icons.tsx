import React from "react";

type IconProps = {
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
};

const Icon = ({
  d,
  size = 18,
  stroke = 1.75,
  className,
  style,
}: IconProps & { d: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, display: "inline-block", ...style }}
    className={className}
  >
    {d}
  </svg>
);

export const ArrowRight = (p: IconProps) => <Icon {...p} d={<path d="M5 12h14M13 5l7 7-7 7" />} />;
export const ArrowLeft  = (p: IconProps) => <Icon {...p} d={<path d="M19 12H5M12 19l-7-7 7-7" />} />;
export const Check      = (p: IconProps) => <Icon {...p} d={<path d="M20 6 9 17l-5-5" />} />;
export const X          = (p: IconProps) => <Icon {...p} d={<path d="M18 6 6 18M6 6l12 12" />} />;
export const Plus       = (p: IconProps) => <Icon {...p} d={<path d="M12 5v14M5 12h14" />} />;
export const Upload     = (p: IconProps) => <Icon {...p} d={<path d="M12 3v12M7 8l5-5 5 5M5 21h14" />} />;
export const Download   = (p: IconProps) => <Icon {...p} d={<path d="M12 3v12M7 10l5 5 5-5M5 21h14" />} />;
export const FileIcon   = (p: IconProps) => <Icon {...p} d={<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6" />} />;
export const Alert      = (p: IconProps) => <Icon {...p} d={<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01" />} />;
export const ChevronDown  = (p: IconProps) => <Icon {...p} d={<path d="m6 9 6 6 6-6" />} />;
export const ChevronUp    = (p: IconProps) => <Icon {...p} d={<path d="m18 15-6-6-6 6" />} />;
export const ChevronRight = (p: IconProps) => <Icon {...p} d={<path d="m9 6 6 6-6 6" />} />;
