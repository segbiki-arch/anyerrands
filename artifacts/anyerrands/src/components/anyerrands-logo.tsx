interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "color";
  className?: string;
}

const sizes = {
  sm:  { icon: 28, text: 15, gap: 8 },
  md:  { icon: 38, text: 20, gap: 10 },
  lg:  { icon: 56, text: 30, gap: 14 },
  xl:  { icon: 80, text: 44, gap: 18 },
};

export function AnyErrandsLogo({ size = "md", variant = "color", className = "" }: LogoProps) {
  const s = sizes[size];
  const textColor =
    variant === "light" ? "#FFFFFF" :
    variant === "dark"  ? "#0D0D0D" :
    "#0D0D0D";

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: s.gap }}
      aria-label="AnyErrands"
    >
      {/* Icon mark */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Yellow rounded square background */}
        <rect width="80" height="80" rx="20" fill="#F5C400" />

        {/* Stylised running figure / errand arrow */}
        {/* Checkmark + motion lines = "errand done, on the move" */}
        <circle cx="40" cy="22" r="8" fill="#0D0D0D" />

        {/* Body — running figure */}
        <path
          d="M28 44 C28 36 34 33 40 33 C46 33 52 36 52 44"
          stroke="#0D0D0D"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Left leg */}
        <path
          d="M33 44 L28 58"
          stroke="#0D0D0D"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Right leg — stride forward */}
        <path
          d="M47 44 L54 56"
          stroke="#0D0D0D"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Left arm — holding bag */}
        <path
          d="M33 38 L24 48"
          stroke="#0D0D0D"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Right arm — reaching forward */}
        <path
          d="M47 38 L57 44"
          stroke="#0D0D0D"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Small bag / parcel on left hand */}
        <rect x="17" y="46" width="10" height="9" rx="2" fill="#0D0D0D" />

        {/* Motion lines */}
        <line x1="14" y1="30" x2="20" y2="30" stroke="#0D0D0D" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <line x1="12" y1="37" x2="19" y2="37" stroke="#0D0D0D" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
        <line x1="14" y1="44" x2="20" y2="44" stroke="#0D0D0D" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
      </svg>

      {/* Wordmark */}
      <div style={{ lineHeight: 1 }}>
        <span
          style={{
            fontSize: s.text,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: textColor,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Any
        </span>
        <span
          style={{
            fontSize: s.text,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#F5C400",
            WebkitTextStroke: variant === "light" ? "0px" : "0px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            ...(variant === "light" ? {
              WebkitTextStroke: "1.5px #0D0D0D",
            } : {}),
          }}
        >
          Errands
        </span>
      </div>
    </div>
  );
}
