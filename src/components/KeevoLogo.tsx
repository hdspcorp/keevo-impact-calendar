import * as React from "react";

/**
 * KeevoLogo — componente reutilizável para a logo da Keevo.
 *
 * Renderiza um wordmark elegante "keevo" com o ponto/destaque em laranja
 * (cor de acento da marca), enquanto o arquivo oficial da logo não está
 * disponível no projeto. Quando o asset oficial for adicionado, basta
 * substituir a renderização por um <img src="..." />.
 */
export function KeevoLogo({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={className}
      style={{ height: size }}
      aria-label="Keevo"
      role="img"
    >
      <svg
        viewBox="0 0 140 40"
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <defs>
          <linearGradient id="kv-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.52 0.22 295)" />
            <stop offset="100%" stopColor="oklch(0.38 0.2 295)" />
          </linearGradient>
        </defs>
        <text
          x="0"
          y="29"
          fontFamily="'Inter','SF Pro Display',system-ui,sans-serif"
          fontWeight={700}
          fontSize="32"
          letterSpacing="-1.5"
          fill="url(#kv-grad)"
        >
          keevo
        </text>
        <circle cx="125" cy="27" r="3.4" fill="oklch(0.74 0.18 55)" />
      </svg>
    </div>
  );
}
