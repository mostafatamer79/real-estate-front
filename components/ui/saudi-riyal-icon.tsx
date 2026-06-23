import React from "react";

type SaudiRiyalIconProps = {
  className?: string;
};

export function SaudiRiyalIcon({ className }: SaudiRiyalIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 8V31L7 33.5C5.7 33.8 4.8 35 5 36.3L5.7 40.5C5.9 41.8 7.1 42.7 8.4 42.4L19 40.2V46L7 48.5C5.7 48.8 4.8 50 5 51.3L5.7 55.5C5.9 56.8 7.1 57.7 8.4 57.4L19.8 55C22.7 54.4 25.3 52.8 27.2 50.5L31 45.8V8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43 14V34L57 31.1C58.3 30.8 59.5 31.7 59.7 33L60.3 37.2C60.5 38.5 59.6 39.7 58.3 40L43 43.2V49L56.1 46.3C57.4 46 58.6 46.9 58.8 48.2L59.5 52.4C59.7 53.7 58.8 54.9 57.5 55.2L36 59.6V8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 31L43 26"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M19 40.5L43 35.5"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
