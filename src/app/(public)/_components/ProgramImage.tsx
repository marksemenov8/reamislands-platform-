import { Icon } from "./Icon"

const COHORT_GRADIENT: Record<number, string> = {
  1: "linear-gradient(135deg, #C8E8D8 0%, #2F8F6E 100%)",
  2: "linear-gradient(135deg, #DFE4C7 0%, #7A8A3C 100%)",
  3: "linear-gradient(135deg, #CBD9EE 0%, #4A6FA5 100%)",
  4: "linear-gradient(135deg, #C8E8D8 0%, #1B5A45 100%)",
}

export default function ProgramImage({
  url,
  cohort,
  alt,
  aspect = "4 / 3",
  rounded,
}: {
  url: string | null | undefined
  cohort: number
  alt: string
  aspect?: string
  rounded?: number
}) {
  const baseStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: aspect,
    objectFit: "cover",
    display: "block",
    borderRadius: rounded,
  }
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} style={baseStyle} loading="lazy" />
  }
  return (
    <div
      aria-hidden="true"
      style={{
        ...baseStyle,
        background: COHORT_GRADIENT[cohort] ?? COHORT_GRADIENT[1],
        display: "grid",
        placeItems: "center",
        color: "rgba(255,255,255,0.65)",
      }}
    >
      <Icon.flower width="42%" height="42%" />
    </div>
  )
}
