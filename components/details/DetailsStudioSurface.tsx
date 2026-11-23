import type { CSSProperties, ReactNode } from 'react';

/** The details workspace inherits the same palette as the sign-in surface. */
export default function DetailsStudioSurface({ children, className, style, dir, icons }: {
  children: ReactNode; className: string; style: CSSProperties;
  dir: 'rtl' | 'ltr'; icons: boolean;
}) {
  return <div className={className} style={style} dir={dir} data-section-icons={icons} data-details-studio>{children}</div>;
}
