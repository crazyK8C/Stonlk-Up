export function Mascot({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? 'mascot small' : 'mascot'}
      viewBox="0 0 300 300"
      role="img"
      aria-label="A very confident market cat"
    >
      <defs>
        <linearGradient id="fur" x2="0" y2="1">
          <stop stopColor="#ededda" />
          <stop offset="1" stopColor="#bfc3aa" />
        </linearGradient>
        <linearGradient id="jacket" x2="1" y2="1">
          <stop stopColor="#a996ef" />
          <stop offset="1" stopColor="#625a97" />
        </linearGradient>
      </defs>
      <ellipse cx="152" cy="267" rx="90" ry="15" fill="#000" opacity=".25" />
      <path
        d="M68 227C34 235 31 182 46 165"
        stroke="#cfd0b7"
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M84 207Q88 150 151 152Q213 150 225 209L226 258Q148 280 79 253Z"
        fill="url(#jacket)"
      />
      <path d="M128 167l23 40 24-41" fill="#f7f4df" />
      <path d="M150 203l-13 38 17 19 13-18-13-39" fill="#d0f57e" />
      <path
        d="M71 105L69 42l53 27q35-14 68 0l49-27-2 72q11 80-82 84-91-4-84-93"
        fill="url(#fur)"
        stroke="#b4b99e"
        strokeWidth="3"
      />
      <path d="M80 54l7 44 28-25M226 54l-28 19 28 25" fill="#daa89e" />
      <path
        d="M129 72l10 20 9-22 9 22 10-22"
        fill="none"
        stroke="#919980"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g transform="rotate(-7 152 117)">
        <rect x="85" y="104" width="56" height="32" rx="10" fill="#202820" />
        <rect x="164" y="104" width="56" height="32" rx="10" fill="#202820" />
        <path d="M139 113h28M83 108l-10-6M220 109l15-7" stroke="#202820" strokeWidth="7" />
        <path
          d="M96 110l16 19m6-19 15 17m43-17 16 19m6-19 15 17"
          stroke="#829778"
          strokeWidth="3"
          opacity=".6"
        />
      </g>
      <path d="M145 142h16l-8 8z" fill="#bc8888" />
      <path
        d="M152 150v6m-16 0q16 17 33-1"
        stroke="#525e4a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M106 144l-37-6m39 14-39 5m127-13 38-8m-37 17 40 5"
        stroke="#88927b"
        strokeWidth="2"
      />
      <path
        d="M83 208q-17-21-21-5l-4 20q7 15 29 10M220 209q24-30 32-17l3 27q-10 19-31 14"
        fill="url(#fur)"
      />
      <path d="M231 199l9-9 5 5" fill="none" stroke="#919980" strokeWidth="3" />
    </svg>
  );
}
export function MiniChart({
  color = '#c5ed83',
  values = [25, 35, 28, 45, 39, 52, 45, 60, 55, 71, 64, 89],
  large = false,
}: {
  color?: string;
  values?: number[];
  large?: boolean;
}) {
  const min = Math.min(...values) - 5,
    max = Math.max(...values) + 5;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 300},${95 - ((v - min) / (max - min)) * 80}`)
    .join(' ');
  return (
    <svg
      className={large ? 'chart large-chart' : 'chart'}
      viewBox="0 0 300 110"
      preserveAspectRatio="none"
      aria-label="Illustrative market line chart"
      role="img"
    >
      <path d="M0 25h300M0 60h300M0 95h300" stroke="#ffffff09" strokeWidth="1" />
      <polygon points={`0,110 ${points} 300,110`} fill={color} opacity=".06" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
