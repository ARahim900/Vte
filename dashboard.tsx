"use client"

import { useState, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts"
import {
  Users,
  Activity,
  FileText,
  AlertCircle,
  CheckCircle,
  Heart,
  Syringe,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  Moon,
  Sun,
  Baby,
  Droplets,
  Stethoscope,
  ShieldAlert,
} from "lucide-react"

// Theme-aware chart colors resolved from CSS design tokens at runtime,
// re-read whenever the active theme changes so charts work in light & dark.
//
// COLOR CONVENTION (keep consistent across every chart):
//   c1 (teal) = 2023, c2 (plum) = 2024 — the locked year-over-year pair used by
//   ALL year-comparison charts (health-center bar/line, age bar, trimester area,
//   risk-factors bar). Do not let this drift chart to chart.
//   c3..c7 = the categorical sequence for non-year series (donut slices, metric
//   trends). The status tokens (success/warning/destructive) encode VTE risk
//   SEVERITY — see `riskSeverity` below — and are kept distinct from the
//   trend-direction pill (which also uses success/destructive for up/down).
interface ChartColors {
  c1: string
  c2: string
  c3: string
  c4: string
  c5: string
  c6: string
  c7: string
  axis: string
  grid: string
  tipBg: string
  tipBorder: string
  tipText: string
  // Severity tokens (resolved alongside the chart sequence) so severity
  // encoding tracks light/dark exactly like the chart series does.
  success: string
  successSoft: string
  warning: string
  warningSoft: string
  destructive: string
  destructiveSoft: string
}

// MoH Oman light-theme fallbacks; replaced at runtime by the resolved CSS vars.
const FALLBACK_CHART: ChartColors = {
  c1: "hsl(198 59% 38%)",
  c2: "hsl(43 62% 47%)",
  c3: "hsl(350 74% 50%)",
  c4: "hsl(206 64% 48%)",
  c5: "hsl(208 53% 30%)",
  c6: "hsl(150 50% 38%)",
  c7: "hsl(40 60% 42%)",
  axis: "hsl(220 9% 42%)",
  grid: "hsl(210 24% 88%)",
  tipBg: "hsl(0 0% 100%)",
  tipBorder: "hsl(210 24% 88%)",
  tipText: "hsl(204 34% 15%)",
  success: "hsl(150 55% 34%)",
  successSoft: "hsl(150 50% 93%)",
  warning: "hsl(38 78% 36%)",
  warningSoft: "hsl(42 82% 91%)",
  destructive: "hsl(350 80% 45%)",
  destructiveSoft: "hsl(350 80% 96%)",
}

// Severity bands for a VTE risk percentage. Thresholds align with the existing
// clinical prose: WADI HIBI 0% reads Low, TAREEF ~60% / AL UWINAT 73.1% read
// High. Returns runtime-resolved token colours so the encoding works in both
// themes; `mark` is the solid dot/fill, `soft` the low-emphasis row tint.
type SeverityToken = "success" | "warning" | "destructive"

interface RiskSeverity {
  token: SeverityToken
  label: "Low" | "Moderate" | "High"
  mark: string
  soft: string
}

function riskSeverity(pct: number, colors: ChartColors): RiskSeverity {
  if (pct < 33) {
    return { token: "success", label: "Low", mark: colors.success, soft: colors.successSoft }
  }
  if (pct <= 60) {
    return { token: "warning", label: "Moderate", mark: colors.warning, soft: colors.warningSoft }
  }
  return { token: "destructive", label: "High", mark: colors.destructive, soft: colors.destructiveSoft }
}

// Outside-positioned, theme-coloured pie label (keeps slice text legible in dark mode)
// Fields are optional to stay structurally compatible with recharts' own
// PieLabelProps (which types every geometry field as `number | undefined`).
interface PieLabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
  percent?: number
  name?: string | number
}

const makePieLabel =
  (color: string) =>
  ({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, name = "" }: PieLabelProps) => {
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 22
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text
        x={x}
        y={y}
        fill={color}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${name}: ${(percent * 100).toFixed(1)}%`}
      </text>
    )
  }

// Visually-hidden table giving screen-reader users the underlying numbers
// behind each chart. Rendered with Tailwind's `sr-only` so it stays in the
// accessibility tree while remaining invisible to sighted users.
interface ChartDataTableProps {
  caption: string
  columns: readonly string[]
  rows: ReadonlyArray<ReadonlyArray<string | number>>
}

function ChartDataTable({ caption, columns, rows }: ChartDataTableProps) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} scope="col">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) =>
              cellIndex === 0 ? (
                <th key={cellIndex} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={cellIndex}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Hoisted, typed chart datasets (values copied exactly from the inline
// definitions) so the same numbers feed both the chart and its sr-only table.
interface YearComparisonRow {
  label: string
  value2023: number
  value2024: number
}

interface DistributionRow {
  name: string
  value: number
}

const ageDistribution: readonly YearComparisonRow[] = [
  { label: "<20", value2023: 4.2, value2024: 4.0 },
  { label: "20-24", value2023: 15.6, value2024: 15.8 },
  { label: "25-29", value2023: 27.3, value2024: 27.1 },
  { label: "30-34", value2023: 28.9, value2024: 28.5 },
  { label: "35-39", value2023: 18.3, value2024: 18.6 },
  { label: "40+", value2023: 7.6, value2024: 7.5 },
]

const trimesterDistribution: readonly YearComparisonRow[] = [
  { label: "First", value2023: 92.1, value2024: 91.8 },
  { label: "Second", value2023: 6.2, value2024: 6.5 },
  { label: "Third", value2023: 1.7, value2024: 1.7 },
]

// Pie `data` expects a mutable array, so these donut datasets are not readonly.
const treatmentCoverage2023: DistributionRow[] = [
  { name: "Receiving Treatment", value: 87.1 },
  { name: "Treatment Gap", value: 12.9 },
]

const treatmentCoverage2024: DistributionRow[] = [
  { name: "Receiving Treatment", value: 63.5 },
  { name: "Treatment Gap", value: 36.5 },
]

// Aggregate, study-wide statistics (no state/props dependency).
const totalStats = {
  totalWomen: 5754,
  year2023: 3282,
  year2024: 2472,
  womenWithRisk: Math.round(5754 * 0.372), // 37.2% of total
  ageAbove35: Math.round(5754 * 0.262), // 26.2% of total
  highRiskPatients: Math.round(5754 * 0.089), // 8.9% of total
}

interface HealthCenter {
  name: string
  count: number
  risk2023: number
  risk2024: number
}

const healthCenters: HealthCenter[] = [
  { name: "SUHAR P.C", count: 2056, risk2023: 10.9, risk2024: 11.8 },
  { name: "AL MULTAQA", count: 1268, risk2023: 50.2, risk2024: 48.7 },
  { name: "TAREEF", count: 792, risk2023: 62.9, risk2024: 59.6 },
  { name: "FALAJ AL QABAIL", count: 774, risk2023: 53.0, risk2024: 51.5 },
  { name: "AL UWINAT", count: 727, risk2023: 59.3, risk2024: 73.1 },
  { name: "WADI HIBI", count: 197, risk2023: 0, risk2024: 0 },
  { name: "WADI AHIN", count: 100, risk2023: 0, risk2024: 66.7 },
]

interface RiskFactor {
  name: string
  value2023: number
  value2024: number
  icon: typeof Heart
}

// Updated riskFactors data to include all factors
const riskFactors: RiskFactor[] = [
  { name: "Previous Pregnancy", value2023: 28.5, value2024: 26.4, icon: Heart },
  { name: "Age ≥35 years", value2023: 25.9, value2024: 26.2, icon: Users },
  { name: "BMI ≥30", value2023: 23.0, value2024: 21.5, icon: Activity },
  { name: "Parity ≥3", value2023: 7.2, value2024: 8.1, icon: Users },
  { name: "Smoking", value2023: 0.7, value2024: 0.9, icon: AlertCircle },
  { name: "Family History", value2023: 2.8, value2024: 2.5, icon: Users },
  { name: "Medical Conditions", value2023: 3.3, value2024: 3.5, icon: FileText },
  { name: "BMI ≥40", value2023: 4.0, value2024: 4.0, icon: Activity },
  { name: "Multiple Pregnancy", value2023: 1.5, value2024: 1.5, icon: Users },
  { name: "ART/IVF Conception", value2023: 1.0, value2024: 1.0, icon: Syringe },
  { name: "Gross Varicose Veins", value2023: 0.5, value2024: 0.5, icon: Heart },
  { name: "Previous VTE", value2023: 0.3, value2024: 0.3, icon: AlertCircle },
  { name: "Thrombophilia", value2023: 0.2, value2024: 0.2, icon: AlertCircle },
]

interface MonthlyTrend {
  month: string
  screening: number
  treatment: number
  referrals: number
}

// Monthly trends data
const monthlyTrends: MonthlyTrend[] = [
  { month: "Jan", screening: 87, treatment: 85, referrals: 12 },
  { month: "Feb", screening: 89, treatment: 87, referrals: 11 },
  { month: "Mar", screening: 91, treatment: 88, referrals: 13 },
  { month: "Apr", screening: 93, treatment: 86, referrals: 10 },
  { month: "May", screening: 92, treatment: 89, referrals: 12 },
  { month: "Jun", screening: 94, treatment: 90, referrals: 11 },
]

// Risk factor count distribution
const riskFactorCountDistribution: DistributionRow[] = [
  { name: "1 Risk Factor", value: 49.2 },
  { name: "2 Risk Factors", value: 35.5 },
  { name: "3 Risk Factors", value: 10.1 },
  { name: "4 Risk Factors", value: 3.5 },
  { name: "5+ Risk Factors", value: 1.7 },
]

// VTE Score Distribution
const vteScoreDistribution: DistributionRow[] = [
  { name: "Score 0-2 (Standard Care)", value: 84 },
  { name: "Score 3-4 (Consider Prophylaxis)", value: 12 },
  { name: "Score ≥5 (Prophylaxis Required)", value: 4 },
]

// ───────────────────────────────────────────────────────────────────────────
// Women & Child Health (WCH) KPIs — North Batinah Region.
// Source: "WCH KPI Nov 2025" report. This is a SEPARATE dataset from the Sohar
// VTE study above (different cohort/scope), surfaced as its own 2019–2025 view.
// ───────────────────────────────────────────────────────────────────────────
interface YearValue {
  year: string
  value: number
}

// Total antenatal-care (ANC) bookings, region-wide
const ancBookingTrend: YearValue[] = [
  { year: "2019", value: 15895 },
  { year: "2020", value: 14199 },
  { year: "2021", value: 15122 },
  { year: "2022", value: 13584 },
  { year: "2023", value: 12549 },
  { year: "2024", value: 12754 },
  { year: "2025", value: 12433 },
]

// % booked in the 1st trimester (region-wide ANC — distinct from the VTE
// cohort's trimester split shown under Demographics)
const firstTrimesterTrend: YearValue[] = [
  { year: "2019", value: 81.2 },
  { year: "2020", value: 82.0 },
  { year: "2021", value: 88.8 },
  { year: "2022", value: 89.0 },
  { year: "2023", value: 94.5 },
  { year: "2024", value: 95.4 },
  { year: "2025", value: 96.0 },
]

// Maternal risk indicators (%). GDM only tracked from 2022 (null earlier).
interface MaternalIndicator {
  year: string
  anemia: number
  gdm: number | null
}
const maternalIndicators: MaternalIndicator[] = [
  { year: "2019", anemia: 32.5, gdm: null },
  { year: "2020", anemia: 28.0, gdm: null },
  { year: "2021", anemia: 27.0, gdm: null },
  { year: "2022", anemia: 28.0, gdm: 21.4 },
  { year: "2023", anemia: 33.9, gdm: 21.2 },
  { year: "2024", anemia: 34.4, gdm: 23.0 },
  { year: "2025", anemia: 28.5, gdm: 19.6 },
]

// Long-acting contraception uptake (%)
interface ContraceptionPoint {
  year: string
  iucd: number
  implanon: number
}
const contraceptionTrend: ContraceptionPoint[] = [
  { year: "2018", iucd: 3, implanon: 3 },
  { year: "2019", iucd: 7, implanon: 7 },
  { year: "2020", iucd: 3, implanon: 3 },
  { year: "2021", iucd: 6, implanon: 6 },
  { year: "2022", iucd: 19, implanon: 13 },
  { year: "2023", iucd: 22, implanon: 19 },
  { year: "2024", iucd: 25, implanon: 25 },
  { year: "2025", iucd: 31, implanon: 31.5 },
]

// Premarital screening (number of people screened)
const premaritalScreeningTrend: YearValue[] = [
  { year: "2019", value: 381 },
  { year: "2020", value: 387 },
  { year: "2021", value: 525 },
  { year: "2022", value: 406 },
  { year: "2023", value: 1670 },
  { year: "2024", value: 973 },
  { year: "2025", value: 1498 },
]

// ASD developmental screening coverage (%). 24-month screening began in 2024.
interface AsdScreeningPoint {
  year: string
  m18: number
  m24: number | null
}
const asdScreeningTrend: AsdScreeningPoint[] = [
  { year: "2019", m18: 82.8, m24: null },
  { year: "2020", m18: 85.5, m24: null },
  { year: "2021", m18: 89.0, m24: null },
  { year: "2022", m18: 92.0, m24: null },
  { year: "2023", m18: 97.8, m24: null },
  { year: "2024", m18: 97.8, m24: 95.7 },
  { year: "2025", m18: 99.0, m24: 98.0 },
]

// Child maltreatment — reported cases per year
const childMaltreatmentTrend: YearValue[] = [
  { year: "2019", value: 100 },
  { year: "2020", value: 63 },
  { year: "2021", value: 33 },
  { year: "2022", value: 73 },
  { year: "2023", value: 92 },
  { year: "2024", value: 195 },
  { year: "2025", value: 204 },
]

// Child maltreatment by type (% of cases), 2024 vs 2025
interface MaltreatmentType {
  type: string
  y2024: number
  y2025: number
}
const maltreatmentByType: MaltreatmentType[] = [
  { type: "Physical Abuse", y2024: 26.7, y2025: 29.9 },
  { type: "Neglect", y2024: 41.0, y2025: 59.3 },
  { type: "Sexual Abuse", y2024: 6.2, y2025: 5.8 },
  { type: "Emotional Abuse", y2024: 2.1, y2025: 2.4 },
  { type: "Others", y2024: 24.1, y2025: 2.4 },
]

interface TabConfig {
  id: string
  label: string
  icon: typeof FileText
}

// Tab configurations
const tabs: TabConfig[] = [
  { id: "executive", label: "Executive Summary", icon: FileText },
  { id: "demographics", label: "Demographics", icon: Users },
  { id: "risk-center", label: "VTE Risk by Center", icon: BarChart3 },
  { id: "risk-factors", label: "Risk Factors", icon: AlertCircle },
  { id: "treatment", label: "Treatment & Medication", icon: Syringe },
  { id: "recommendations", label: "Recommendations", icon: Target },
  { id: "wch", label: "Women & Child Health", icon: Baby },
]

// Animated counter effect — hoisted to module scope so it isn't redefined
// on every Dashboard render. Honors prefers-reduced-motion and cleans up its
// requestAnimationFrame loop on unmount / value change.
interface AnimatedNumberProps {
  value: number | string
  duration?: number
  prefix?: string
  suffix?: string
}

function AnimatedNumber({ value, duration = 2000, prefix = "", suffix = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const numericValue = typeof value === "string" ? Number.parseFloat(value) || 0 : value || 0

    if (isNaN(numericValue)) {
      setDisplayValue(0)
      return
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayValue(numericValue)
      return
    }

    let frameId = 0
    let startTime: number | null = null
    const animateValue = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const currentValue = Math.floor(progress * numericValue)
      setDisplayValue(currentValue)

      if (progress < 1) {
        frameId = requestAnimationFrame(animateValue)
      }
    }

    frameId = requestAnimationFrame(animateValue)

    return () => cancelAnimationFrame(frameId)
  }, [value, duration])

  return (
    <>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </>
  )
}

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("executive")

  // Responsive wiring: below 768px we trade outside pie labels for a compact
  // <Legend> and shrink tall charts so they don't dominate the viewport.
  // SSR-safe (returns false until mounted), consistent with the `mounted` gate.
  const isMobile = useIsMobile()

  // Theme wiring
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [chart, setChart] = useState<ChartColors>(FALLBACK_CHART)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const cs = getComputedStyle(document.documentElement)
    const hsl = (name: string) => `hsl(${cs.getPropertyValue(name).trim()})`
    setChart({
      c1: hsl("--chart-1"),
      c2: hsl("--chart-2"),
      c3: hsl("--chart-3"),
      c4: hsl("--chart-4"),
      c5: hsl("--chart-5"),
      c6: hsl("--chart-6"),
      c7: hsl("--chart-7"),
      axis: hsl("--muted-foreground"),
      grid: hsl("--border"),
      tipBg: hsl("--popover"),
      tipBorder: hsl("--border"),
      tipText: hsl("--popover-foreground"),
      success: hsl("--success"),
      successSoft: hsl("--success-soft"),
      warning: hsl("--warning"),
      warningSoft: hsl("--warning-soft"),
      destructive: hsl("--destructive"),
      destructiveSoft: hsl("--destructive-soft"),
    })
  }, [resolvedTheme, mounted])

  const CHART_SERIES = [chart.c1, chart.c2, chart.c3, chart.c4, chart.c5, chart.c6, chart.c7]
  const tooltipStyle = {
    backgroundColor: chart.tipBg,
    border: `1px solid ${chart.tipBorder}`,
    borderRadius: "8px",
    color: chart.tipText,
  }
  const axisTick = { fill: chart.axis, fontSize: 12 }

  // Responsive chart heights: trim verticals on phones so a single chart
  // doesn't fill the viewport, while keeping desktop heights unchanged.
  // Pie/donut heights stay tall enough that the mobile <Legend> fits below.
  const tallChartH = isMobile ? 280 : 400 // big bar/line/area charts (desktop 400)
  const barChartH = isMobile ? 260 : 350 // executive health-center bar (desktop 350)
  const areaChartH = isMobile ? 240 : 300 // trimester area (desktop 300)
  const labeledPieH = isMobile ? 340 : 400 // pies that swap labels for a legend on mobile
  const donutH = isMobile ? 320 : 350 // executive data-source donut (desktop 350)
  const treatmentDonutH = 300 // treatment donuts keep their height so the big callout below stays readable
  // Shared mobile legend styling (token-coloured, matches every other Legend).
  const mobileLegendStyle = { color: chart.axis, fontSize: 12 }

  // Roving-tabindex keyboard navigation for the tablist: Left/Right move
  // between tabs, Home/End jump to the first/last, and focus follows selection.
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const focusTab = (tabId: string) => {
    setSelectedTab(tabId)
    tabRefs.current[tabId]?.focus()
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % tabs.length
        break
      case "ArrowLeft":
        nextIndex = (index - 1 + tabs.length) % tabs.length
        break
      case "Home":
        nextIndex = 0
        break
      case "End":
        nextIndex = tabs.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    focusTab(tabs[nextIndex].id)
  }

  // Custom MetricCard component
  const MetricCard = ({
    icon,
    title,
    value,
    subtitle,
    trend,
    accent,
    delay = 0,
  }: {
    icon: ReactNode
    title: string
    value: number | string
    subtitle?: string
    trend?: number
    accent: string
    delay?: number
  }) => (
    <div
      className="panel-hover surface-panel relative overflow-hidden rounded-2xl p-6 animate-fadeInUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div
            className="p-3 rounded-xl"
            style={{ color: accent, backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)` }}
          >
            {icon}
          </div>
          {typeof trend === "number" && (
            <div
              className={`flex items-center px-3 py-1 rounded-full text-sm font-medium
                          ${trend > 0 ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive"}`}
            >
              {trend > 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <h3 className="text-4xl font-bold text-foreground mb-2 tabular-nums">
          {typeof value === "string" && value.includes("%") ? (
            <AnimatedNumber value={Number.parseFloat(value)} suffix="%" />
          ) : (
            <AnimatedNumber value={value} />
          )}
        </h3>
        <p className="text-foreground/90 font-medium">{title}</p>
        {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0 mr-6">
                <Image
                  src="/images/ministry-of-health-logo.png"
                  alt="Ministry of Health, Sultanate of Oman"
                  width={107}
                  height={64}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-foreground">Maternal VTE Risk Assessment Report</h1>
                <p className="text-muted-foreground text-sm">
                  North Batinah Region - Sohar Wilayate Health Centers (2023-2024)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
              className="flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 overflow-x-auto pb-2" role="tablist" aria-label="Report sections">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el
              }}
              role="tab"
              aria-selected={selectedTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={selectedTab === tab.id ? 0 : -1}
              onClick={() => setSelectedTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`flex items-center min-h-[44px] px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                         whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                         focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                           selectedTab === tab.id
                             ? "bg-primary text-primary-foreground shadow-sm"
                             : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
                         }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedTab === "executive" && (
          <div className="space-y-8" role="tabpanel" id="panel-executive" aria-labelledby="tab-executive">
            {/* Study Overview */}
            <section className="animate-fadeInUp">
              <h2 className="text-2xl font-bold text-foreground mb-3">Study Overview</h2>
              <div className="surface-panel surface-panel-hero rounded-2xl p-8">
              <p className="text-muted-foreground leading-relaxed">
                This report presents a comprehensive analysis of Venous Thromboembolism (VTE) risk assessment data for
                pregnant women in the North Batinah Region (NBR), specifically from the Wilayat of Sohar, for 2023 and
                2024. The analysis integrates data from both CSV datasets and Sohar P.C. records to provide a complete
                picture of maternal VTE risk factors and management trends.
              </p>
              </div>
            </section>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                icon={<Users className="w-6 h-6" />}
                title="Total Pregnant Women"
                value={totalStats.totalWomen}
                subtitle={`2023: ${totalStats.year2023} | 2024: ${totalStats.year2024}`}
                trend={52.8}
                accent={chart.c4}
                delay={0}
              />
              <MetricCard
                icon={<Activity className="w-6 h-6" />}
                title="Women with VTE Risk Factors"
                value={`${totalStats.womenWithRisk}`}
                subtitle="37.2% of total population"
                trend={-17.6}
                accent={chart.c2}
                delay={100}
              />
              <MetricCard
                icon={<AlertCircle className="w-6 h-6" />}
                title="Patients Age ≥35 years"
                value={`${totalStats.ageAbove35}`}
                subtitle="26.2% of total population"
                trend={0.3}
                accent={chart.c1}
                delay={200}
              />
              <MetricCard
                icon={<Heart className="w-6 h-6" />}
                title="High-Risk Patients"
                value={`${totalStats.highRiskPatients}`}
                subtitle="8.9% of total population"
                trend={-3.1}
                accent={chart.c3}
                delay={300}
              />
              <MetricCard
                icon={<CheckCircle className="w-6 h-6" />}
                title="VTE Screening Coverage"
                value="66.6"
                subtitle="Overall screening rate"
                trend={12.3}
                accent={chart.c6}
                delay={400}
              />
              <MetricCard
                icon={<Syringe className="w-6 h-6" />}
                title="Treatment Coverage"
                value="75.3"
                subtitle="High-risk patients treated"
                trend={-11.6}
                accent={chart.c5}
                delay={500}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Center Distribution */}
              <div className="surface-panel rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
                <h3 className="text-xl font-bold text-foreground mb-6">VTE Risk by Health Center (%)</h3>
                <figure
                  role="group"
                  aria-label="Grouped bar chart comparing VTE risk percentage by health center for 2023 and 2024"
                >
                <ResponsiveContainer width="100%" height={barChartH}>
                  <ComposedChart data={healthCenters} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                    <defs>
                      <linearGradient id="colorGradient2023" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chart.c1} stopOpacity={0.9} />
                        <stop offset="95%" stopColor={chart.c1} stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="colorGradient2024" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chart.c2} stopOpacity={0.9} />
                        <stop offset="95%" stopColor={chart.c2} stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      tick={axisTick}
                      height={80}
                      interval={0}
                    />
                    <YAxis tick={axisTick} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                    <Legend wrapperStyle={{ color: chart.axis }} />
                    <Bar dataKey="risk2023" fill="url(#colorGradient2023)" name="2023" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="risk2024" fill="url(#colorGradient2024)" name="2024" radius={[8, 8, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
                <ChartDataTable
                  caption="VTE risk percentage by health center, 2023 versus 2024"
                  columns={["Health Center", "Risk % 2023", "Risk % 2024"]}
                  rows={healthCenters.map((c) => [c.name, `${c.risk2023}%`, `${c.risk2024}%`])}
                />
                </figure>
              </div>

              {/* Data Source Distribution */}
              <div className="surface-panel rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "700ms" }}>
                <h3 className="text-xl font-bold text-foreground mb-6">Data Source Distribution</h3>
                <figure
                  role="group"
                  aria-label="Donut chart showing the distribution of patient records across the seven health centers"
                >
                <ResponsiveContainer width="100%" height={donutH}>
                  <PieChart>
                    <Pie
                      data={healthCenters}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      label={isMobile ? false : makePieLabel(chart.axis)}
                      labelLine={false}
                    >
                      {healthCenters.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_SERIES[index % CHART_SERIES.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={mobileLegendStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <ChartDataTable
                  caption="Patient record count by health center"
                  columns={["Health Center", "Total Records"]}
                  rows={healthCenters.map((c) => [c.name, c.count])}
                />
                </figure>
              </div>
            </div>

            {/* Important Note */}
            <div
              className="surface-panel rounded-2xl p-6 border-l-4 border-l-warning animate-fadeInUp"
              style={{ animationDelay: "800ms" }}
            >
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-warning mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Important Note on Data Collection</h4>
                  <p className="text-muted-foreground">
                    In 2023, data was collected separately with 659 patients from CSV files and 1,142 from Sohar P.C. In
                    2024, the combined dataset includes 1,563 patients from CSV files and 1,189 from Sohar P.C., for a
                    total of 2,752 patients, representing a 52.8% overall increase. The expansion of data collection
                    should be considered when interpreting year-over-year trends.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "demographics" && (
          <div className="space-y-8" role="tabpanel" id="panel-demographics" aria-labelledby="tab-demographics">
            {/* Age Distribution */}
            <section className="animate-fadeInUp">
              <h2 className="text-2xl font-bold text-foreground mb-3">Age Distribution</h2>
              <div className="surface-panel surface-panel-hero rounded-2xl p-8">
              <figure
                role="group"
                aria-label="Grouped bar chart of maternal age distribution by percentage for 2023 and 2024"
              >
              <ResponsiveContainer width="100%" height={tallChartH}>
                <BarChart data={ageDistribution.map((d) => ({ age: d.label, value2023: d.value2023, value2024: d.value2024 }))}>
                  <defs>
                    <linearGradient id="ageGrad2023" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.c1} stopOpacity={0.9} />
                      <stop offset="95%" stopColor={chart.c1} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="ageGrad2024" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.c2} stopOpacity={0.9} />
                      <stop offset="95%" stopColor={chart.c2} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="age" tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                  <Legend wrapperStyle={{ color: chart.axis }} />
                  <Bar dataKey="value2023" fill="url(#ageGrad2023)" name="2023" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="value2024" fill="url(#ageGrad2024)" name="2024" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <ChartDataTable
                caption="Maternal age distribution by percentage, 2023 versus 2024"
                columns={["Age Group", "2023 %", "2024 %"]}
                rows={ageDistribution.map((d) => [d.label, `${d.value2023}%`, `${d.value2024}%`])}
              />
              </figure>
              <p className="text-muted-foreground mt-4">
                Women aged 30-34 represent the largest age group, while the proportion of women aged ≥35 years
                (high-risk category) shows a slight increase from 25.9% to 26.2%.
              </p>
              </div>
            </section>

            {/* Booking Trimester Distribution */}
            <div className="surface-panel rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "200ms" }}>
              <h3 className="text-2xl font-bold text-foreground mb-6">Booking Trimester Distribution</h3>
              <figure
                role="group"
                aria-label="Area chart of booking trimester distribution by percentage for 2023 and 2024"
              >
              <ResponsiveContainer width="100%" height={areaChartH}>
                <AreaChart data={trimesterDistribution.map((d) => ({ trimester: d.label, value2023: d.value2023, value2024: d.value2024 }))}>
                  <defs>
                    <linearGradient id="trimesterGrad2023" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.c1} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={chart.c1} stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="trimesterGrad2024" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.c2} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={chart.c2} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="trimester" tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                  <Legend wrapperStyle={{ color: chart.axis }} />
                  <Area
                    type="monotone"
                    dataKey="value2023"
                    stroke={chart.c1}
                    fill="url(#trimesterGrad2023)"
                    strokeWidth={3}
                    name="2023"
                  />
                  <Area
                    type="monotone"
                    dataKey="value2024"
                    stroke={chart.c2}
                    fill="url(#trimesterGrad2024)"
                    strokeWidth={3}
                    name="2024"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <ChartDataTable
                caption="Booking trimester distribution by percentage, 2023 versus 2024"
                columns={["Trimester", "2023 %", "2024 %"]}
                rows={trimesterDistribution.map((d) => [d.label, `${d.value2023}%`, `${d.value2024}%`])}
              />
              </figure>
              <p className="text-muted-foreground mt-4">
                First trimester booking rates remain consistently high across both years, indicating excellent early
                prenatal care access.
              </p>
            </div>
          </div>
        )}

        {selectedTab === "risk-center" && (
          <div className="space-y-8" role="tabpanel" id="panel-risk-center" aria-labelledby="tab-risk-center">
            {/* Risk Trend Chart */}
            <section className="animate-fadeInUp">
              <h2 className="text-2xl font-bold text-foreground mb-3">VTE Risk by Center</h2>
              <div className="surface-panel surface-panel-hero rounded-2xl p-8">
              <figure
                role="group"
                aria-label="Line chart comparing VTE risk percentage by health center for 2023 and 2024"
              >
              <ResponsiveContainer width="100%" height={tallChartH}>
                <LineChart data={healthCenters}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    tick={axisTick}
                    height={80}
                    interval={0}
                  />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                  <Legend wrapperStyle={{ color: chart.axis }} />
                  <Line
                    type="monotone"
                    dataKey="risk2023"
                    stroke={chart.c1}
                    strokeWidth={3}
                    dot={{ fill: chart.c1, r: 6 }}
                    name="2023"
                  />
                  <Line
                    type="monotone"
                    dataKey="risk2024"
                    stroke={chart.c2}
                    strokeWidth={3}
                    dot={{ fill: chart.c2, r: 6 }}
                    name="2024"
                  />
                </LineChart>
              </ResponsiveContainer>
              <ChartDataTable
                caption="VTE risk percentage by health center, 2023 versus 2024"
                columns={["Health Center", "Risk % 2023", "Risk % 2024"]}
                rows={healthCenters.map((c) => [c.name, `${c.risk2023}%`, `${c.risk2024}%`])}
              />
              </figure>
              </div>
            </section>

            {/* Health Center Table */}
            <div
              className="surface-panel rounded-2xl overflow-hidden animate-fadeInUp"
              style={{ animationDelay: "200ms" }}
            >
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold text-foreground">Health Center Risk Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Health Center
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Total Records
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Risk % 2023
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Risk % 2024
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {healthCenters.map((center) => {
                      // Encode absolute VTE risk SEVERITY (Low/Moderate/High) on the
                      // row marker + a soft row tint, so clinicians can scan severity
                      // down the column. This is distinct from the Change pill, which
                      // encodes year-over-year trend DIRECTION. Tint is layered beneath
                      // the hover:bg-muted/50 highlight via a soft token at low opacity.
                      const severity = riskSeverity(center.risk2024, chart)
                      return (
                      <tr
                        key={center.name}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td
                          className="px-6 py-4 whitespace-nowrap border-l-4"
                          style={{
                            borderLeftColor: severity.mark,
                            backgroundColor: `color-mix(in srgb, ${severity.mark} 8%, transparent)`,
                          }}
                        >
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: severity.mark }}
                              aria-hidden="true"
                            />
                            <span className="text-sm font-medium text-foreground">{center.name}</span>
                            <span className="sr-only">{` (${severity.label} VTE risk)`}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                          {center.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground tabular-nums">{center.risk2023}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground tabular-nums">{center.risk2024}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums ${
                              center.risk2024 > center.risk2023
                                ? "bg-destructive-soft text-destructive"
                                : center.risk2024 < center.risk2023
                                  ? "bg-success-soft text-success"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {center.risk2024 > center.risk2023 && "+"}
                            {(center.risk2024 - center.risk2023).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Critical Observations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="surface-panel rounded-2xl p-6 border-l-4 border-l-destructive animate-fadeInUp"
                style={{ animationDelay: "400ms" }}
              >
                <h4 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-destructive" />
                  Highest Risk Center
                </h4>
                <p className="text-muted-foreground">
                  AL UWINAT H/C shows the highest VTE risk in both years (59.3% → 73.1%) with the most significant
                  increase (+13.8%)
                </p>
              </div>

              <div
                className="surface-panel rounded-2xl p-6 border-l-4 border-l-info animate-fadeInUp"
                style={{ animationDelay: "500ms" }}
              >
                <h4 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-info" />
                  New Centers
                </h4>
                <p className="text-muted-foreground">
                  Two new centers were added in 2024: WADI AHIN with high risk (66.7%) and WADI HIBI with zero recorded
                  risk
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "risk-factors" && (
          <div className="space-y-8" role="tabpanel" id="panel-risk-factors" aria-labelledby="tab-risk-factors">
            {/* Risk Factors Distribution */}
            <section className="animate-fadeInUp">
              <h2 className="text-2xl font-bold text-foreground mb-3">Risk Factors Distribution</h2>
              <div className="surface-panel surface-panel-hero rounded-2xl p-8">
              <figure
                role="group"
                aria-label="Grouped bar chart of the top seven VTE risk factors by prevalence percentage for 2023 and 2024"
              >
              <ResponsiveContainer width="100%" height={tallChartH}>
                <ComposedChart
                  data={riskFactors.slice(0, 7).map((item) => ({
                    name: item.name,
                    year2023: item.value2023,
                    year2024: item.value2024,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                  <defs>
                    <linearGradient id="riskFactorGrad2023" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.c1} stopOpacity={0.9} />
                      <stop offset="95%" stopColor={chart.c1} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="riskFactorGrad2024" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.c2} stopOpacity={0.9} />
                      <stop offset="95%" stopColor={chart.c2} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                  <Legend wrapperStyle={{ color: chart.axis }} />
                  <Bar dataKey="year2023" fill="url(#riskFactorGrad2023)" name="2023" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="year2024" fill="url(#riskFactorGrad2024)" name="2024" radius={[8, 8, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
              <ChartDataTable
                caption="Top seven VTE risk factors by prevalence percentage, 2023 versus 2024"
                columns={["Risk Factor", "2023 %", "2024 %"]}
                rows={riskFactors.slice(0, 7).map((f) => [f.name, `${f.value2023}%`, `${f.value2024}%`])}
              />
              </figure>
              <p className="text-muted-foreground mt-4 text-sm">
                Top 7 risk factors shown. Previous pregnancy, age ≥35 years, and BMI ≥30 are the most prevalent risk
                factors.
              </p>
              </div>
            </section>

            {/* Risk Factor Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {riskFactors.slice(0, 6).map((factor, index) => {
                const Icon = factor.icon
                const change = factor.value2024 - factor.value2023
                return (
                  <div
                    key={factor.name}
                    className="panel-hover surface-panel rounded-2xl p-6 animate-fadeInUp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{
                          color: CHART_SERIES[index % CHART_SERIES.length],
                          backgroundColor: `color-mix(in srgb, ${CHART_SERIES[index % CHART_SERIES.length]} 14%, transparent)`,
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-sm font-medium px-3 py-1 rounded-full tabular-nums ${
                          change > 0 ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success"
                        }`}
                      >
                        {change > 0 ? "+" : ""}
                        {change.toFixed(1)}%
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">{factor.name}</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">2023: {factor.value2023}%</span>
                      <span className="text-muted-foreground">2024: {factor.value2024}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Risk Factor Count Distribution Pie Chart */}
            <div className="surface-panel rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <h3 className="text-2xl font-bold text-foreground mb-6">
                Number of Risk Factors per Patient (2024)
              </h3>
              <figure
                role="group"
                aria-label="Pie chart of the percentage of patients by number of VTE risk factors identified in 2024"
              >
              <ResponsiveContainer width="100%" height={labeledPieH}>
                <PieChart>
                  <Pie
                    data={riskFactorCountDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={isMobile ? false : makePieLabel(chart.axis)}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {riskFactorCountDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_SERIES[index % CHART_SERIES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  {isMobile && <Legend wrapperStyle={mobileLegendStyle} />}
                </PieChart>
              </ResponsiveContainer>
              <ChartDataTable
                caption="Percentage of patients by number of VTE risk factors identified, 2024"
                columns={["Number of Risk Factors", "Percentage of Patients"]}
                rows={riskFactorCountDistribution.map((d) => [d.name, `${d.value}%`])}
              />
              </figure>
            </div>

            {/* VTE Score Distribution Pie Chart */}
            <div className="surface-panel rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "700ms" }}>
              <h3 className="text-2xl font-bold text-foreground mb-6">VTE Score Distribution (2024)</h3>
              <figure
                role="group"
                aria-label="Pie chart of the percentage of patients by VTE score category in 2024"
              >
              <ResponsiveContainer width="100%" height={labeledPieH}>
                <PieChart>
                  <Pie
                    data={vteScoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={isMobile ? false : makePieLabel(chart.axis)}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {vteScoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_SERIES[index % CHART_SERIES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  {isMobile && <Legend wrapperStyle={mobileLegendStyle} />}
                </PieChart>
              </ResponsiveContainer>
              <ChartDataTable
                caption="Percentage of patients by VTE score category, 2024"
                columns={["VTE Score Category", "Percentage of Patients"]}
                rows={vteScoreDistribution.map((d) => [d.name, `${d.value}%`])}
              />
              </figure>
              <p className="text-muted-foreground mt-4">
                Patients with 3 or more risk factors (15.2% of at-risk patients) should be prioritized for
                thromboprophylaxis and require close monitoring throughout pregnancy.
              </p>
            </div>
          </div>
        )}

        {selectedTab === "treatment" && (
          <div className="space-y-8" role="tabpanel" id="panel-treatment" aria-labelledby="tab-treatment">
            <h2 className="sr-only">Treatment &amp; Medication</h2>
            {/* Treatment Coverage Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="surface-panel rounded-2xl p-8 animate-fadeInUp">
                <h3 className="text-xl font-bold text-foreground mb-6 text-center">2023 Treatment Coverage</h3>
                <figure
                  role="group"
                  aria-label="Donut chart of 2023 treatment coverage: patients receiving treatment versus treatment gap"
                >
                <ResponsiveContainer width="100%" height={treatmentDonutH}>
                  <PieChart>
                    <Pie
                      data={treatmentCoverage2023}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      startAngle={90}
                      endAngle={450}
                      dataKey="value"
                    >
                      <Cell fill={chart.c6} />
                      <Cell fill={chart.c5} />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    {isMobile && <Legend wrapperStyle={mobileLegendStyle} />}
                  </PieChart>
                </ResponsiveContainer>
                <ChartDataTable
                  caption="2023 treatment coverage by percentage"
                  columns={["Category", "Percentage"]}
                  rows={treatmentCoverage2023.map((d) => [d.name, `${d.value}%`])}
                />
                </figure>
                <div className="text-center">
                  <p className="text-3xl font-bold text-success tabular-nums">87.1%</p>
                  <p className="text-muted-foreground">Receiving Treatment</p>
                </div>
              </div>

              <div className="surface-panel rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "200ms" }}>
                <h3 className="text-xl font-bold text-foreground mb-6 text-center">2024 Treatment Coverage</h3>
                <figure
                  role="group"
                  aria-label="Donut chart of 2024 treatment coverage: patients receiving treatment versus treatment gap"
                >
                <ResponsiveContainer width="100%" height={treatmentDonutH}>
                  <PieChart>
                    <Pie
                      data={treatmentCoverage2024}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      startAngle={90}
                      endAngle={450}
                      dataKey="value"
                    >
                      <Cell fill={chart.c6} />
                      <Cell fill={chart.c5} />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    {isMobile && <Legend wrapperStyle={mobileLegendStyle} />}
                  </PieChart>
                </ResponsiveContainer>
                <ChartDataTable
                  caption="2024 treatment coverage by percentage"
                  columns={["Category", "Percentage"]}
                  rows={treatmentCoverage2024.map((d) => [d.name, `${d.value}%`])}
                />
                </figure>
                <div className="text-center">
                  <p className="text-3xl font-bold text-success tabular-nums">63.5%</p>
                  <p className="text-muted-foreground">Receiving Treatment</p>
                </div>
              </div>
            </div>

            {/* Treatment Trends */}
            <div className="surface-panel rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
              <h3 className="text-2xl font-bold text-foreground mb-6">Monthly Treatment & Screening Trends</h3>
              <figure
                role="group"
                aria-label="Combined area and line chart of monthly screening, treatment, and referral percentages from January to June"
              >
              {/* Metric series (not a year pair): screening=c1, treatment=c2,
                  referrals=c3 use the categorical sequence intentionally. */}
              <ResponsiveContainer width="100%" height={tallChartH}>
                <LineChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="screeningGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.c1} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={chart.c1} stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="treatmentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.c2} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={chart.c2} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="month" tick={axisTick} />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                  <Legend wrapperStyle={{ color: chart.axis }} />
                  <Area
                    type="monotone"
                    dataKey="screening"
                    stroke={chart.c1}
                    fill="url(#screeningGrad)"
                    strokeWidth={3}
                    name="Screening %"
                  />
                  <Area
                    type="monotone"
                    dataKey="treatment"
                    stroke={chart.c2}
                    fill="url(#treatmentGrad)"
                    strokeWidth={3}
                    name="Treatment %"
                  />
                  <Line
                    type="monotone"
                    dataKey="referrals"
                    stroke={chart.c3}
                    strokeWidth={3}
                    dot={{ fill: chart.c3, r: 6 }}
                    name="Referrals %"
                  />
                </LineChart>
              </ResponsiveContainer>
              <ChartDataTable
                caption="Monthly screening, treatment, and referral percentages, January through June"
                columns={["Month", "Screening %", "Treatment %", "Referrals %"]}
                rows={monthlyTrends.map((m) => [m.month, `${m.screening}%`, `${m.treatment}%`, `${m.referrals}%`])}
              />
              </figure>
            </div>

            {/* VTE Score Availability */}
            <div className="surface-panel rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <h3 className="text-2xl font-bold text-foreground mb-6">VTE Score Availability</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium text-foreground">At Booking</span>
                    <span className="text-sm font-medium text-success">+6.2%</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-between px-4 text-sm text-foreground z-10">
                        <span>2023: 66.6%</span>
                        <span>2024: 66.6%</span>
                      </div>
                      <div
                        className="bg-gradient-to-r from-primary to-accent h-8 rounded-full transition-all duration-1000"
                        style={{ width: "66.6%" }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium text-foreground">At 28 Weeks</span>
                    <span className="text-sm font-medium text-success">Significant improvement</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-between px-4 text-sm text-foreground z-10">
                        <span>2023: N/A</span>
                        <span>2024: 42.5%</span>
                      </div>
                      <div
                        className="bg-gradient-to-r from-warning to-destructive h-8 rounded-full transition-all duration-1000"
                        style={{ width: "42.5%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-info-soft rounded-lg border border-info/30">
                <p className="text-info text-sm">
                  <strong>Significant Improvement:</strong> VTE scoring at 28 weeks has reached 87.0% in 2024, showing
                  excellent progress in follow-up assessment. This is a major positive finding from the combined
                  dataset.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "recommendations" && (
          <div className="space-y-8" role="tabpanel" id="panel-recommendations" aria-labelledby="tab-recommendations">
            <h2 className="text-3xl font-bold text-foreground mb-2 animate-fadeInUp">Key Recommendations</h2>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  number: 1,
                  title: "Standardize data integration across sources",
                  description:
                    "Develop a unified data collection system that integrates CSV and Sohar P.C. records with consistent fields, definitions, and coding to enable more accurate comparisons and trend analysis.",
                  icon: FileText,
                  accent: chart.c4,
                },
                {
                  number: 2,
                  title: "Address treatment gap",
                  description:
                    "Investigate and address the decrease in treatment coverage for high-risk patients (87.1% to 63.5%). Implement protocols to ensure all high-risk patients receive appropriate medication across all health centers, especially focusing on new centers.",
                  icon: Syringe,
                  accent: chart.c2,
                },
                {
                  number: 3,
                  title: "Maintain 28-week VTE assessment success",
                  description:
                    "Build on the significant improvement in 28-week assessment (now at 87.0%) by implementing a standardized protocol across all centers and targeting 95%+ coverage in future years.",
                  icon: Target,
                  accent: chart.c6,
                },
                {
                  number: 4,
                  title: "Target high-risk centers",
                  description:
                    "Implement specialized VTE risk reduction programs at AL UWINAT H/C and WADI AHIN, which show the highest risk percentages. Investigate why WADI HIBI reports zero VTE risk and verify data collection practices.",
                  icon: AlertCircle,
                  accent: chart.c3,
                },
              ].map((rec, index) => (
                <div
                  key={rec.number}
                  className="panel-hover surface-panel rounded-2xl p-8 animate-fadeInUp"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-start">
                    <div
                      className="p-3 rounded-xl mr-4 flex-shrink-0"
                      style={{ color: rec.accent, backgroundColor: `color-mix(in srgb, ${rec.accent} 14%, transparent)` }}
                    >
                      <rec.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-3">
                        {rec.number}. {rec.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Expected Outcomes */}
            <div className="surface-panel rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <h3 className="text-2xl font-bold text-foreground mb-8 text-center">Expected Outcomes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div
                    className="rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center"
                    style={{ color: chart.c4, backgroundColor: `color-mix(in srgb, ${chart.c4} 16%, transparent)` }}
                  >
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-3">Improved Data Quality</h4>
                  <ul className="text-muted-foreground text-sm space-y-2">
                    <li>• Unified data collection system</li>
                    <li>• Standardized risk factor documentation</li>
                    <li>• 95%+ data completion rates</li>
                    <li>• Integrated health center reporting</li>
                  </ul>
                </div>

                <div className="text-center">
                  <div
                    className="rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center"
                    style={{ color: chart.c1, backgroundColor: `color-mix(in srgb, ${chart.c1} 16%, transparent)` }}
                  >
                    <Shield className="w-10 h-10" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-3">Reduced VTE Risk</h4>
                  <ul className="text-muted-foreground text-sm space-y-2">
                    <li>• Enhanced risk assessment tools</li>
                    <li>• 28-week assessment rate {" > "} 95%</li>
                    <li>• Targeted interventions at high-risk centers</li>
                    <li>• Standardized prophylaxis protocols</li>
                  </ul>
                </div>

                <div className="text-center">
                  <div
                    className="rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center"
                    style={{ color: chart.c5, backgroundColor: `color-mix(in srgb, ${chart.c5} 16%, transparent)` }}
                  >
                    <Heart className="w-10 h-10" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-3">Better Patient Outcomes</h4>
                  <ul className="text-muted-foreground text-sm space-y-2">
                    <li>• Treatment coverage rate {" > "} 95%</li>
                    <li>• Improved early detection of risk factors</li>
                    <li>• Consistent follow-up throughout pregnancy</li>
                    <li>• Well-trained healthcare providers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "wch" && (
          <div className="space-y-8" role="tabpanel" id="panel-wch" aria-labelledby="tab-wch">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Women &amp; Child Health KPIs</h2>
              <p className="text-muted-foreground text-sm mt-1">
                North Batinah Region · 2019–2025 · Source: WCH KPI report (Nov 2025)
              </p>
            </div>

            {/* Source caveat */}
            <div className="surface-panel rounded-2xl p-4 border-l-4 border-l-info flex items-start gap-3">
              <FileText className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground text-sm">
                These are region-wide Women &amp; Child Health indicators — a separate dataset from the Sohar maternal
                VTE study shown in the other tabs. Percentages and counts are reported per the WCH KPI deck.
              </p>
            </div>

            {/* 2025 headline metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                icon={<Stethoscope className="w-6 h-6" />}
                title="Total ANC Bookings"
                value={ancBookingTrend[ancBookingTrend.length - 1].value}
                subtitle="2025 · region-wide (2024: 12,754)"
                accent={chart.c1}
                delay={0}
              />
              <MetricCard
                icon={<CheckCircle className="w-6 h-6" />}
                title="1st-Trimester Booking"
                value="96.0%"
                subtitle="Early registration (2024: 95.4%)"
                trend={0.6}
                accent={chart.c4}
                delay={100}
              />
              <MetricCard
                icon={<Droplets className="w-6 h-6" />}
                title="Anemia in Pregnancy"
                value="28.5%"
                subtitle="2025 (2024: 34.4%)"
                accent={chart.c3}
                delay={200}
              />
              <MetricCard
                icon={<Activity className="w-6 h-6" />}
                title="Gestational Diabetes"
                value="19.6%"
                subtitle="GDM in 2025 (2024: 23.0%)"
                accent={chart.c2}
                delay={300}
              />
              <MetricCard
                icon={<Shield className="w-6 h-6" />}
                title="Implanon Uptake"
                value="31.5%"
                subtitle="Long-acting contraception (2024: 25%)"
                trend={6.5}
                accent={chart.c6}
                delay={400}
              />
              <MetricCard
                icon={<ShieldAlert className="w-6 h-6" />}
                title="Child Maltreatment"
                value={childMaltreatmentTrend[childMaltreatmentTrend.length - 1].value}
                subtitle="Reported cases in 2025 (2024: 195)"
                accent={chart.c5}
                delay={500}
              />
            </div>

            {/* Antenatal care */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="surface-panel surface-panel-hero rounded-2xl p-6 animate-fadeInUp">
                <h3 className="text-xl font-bold text-foreground mb-6">Total ANC Bookings</h3>
                <figure role="group" aria-label="Total antenatal care bookings per year, 2019 to 2025">
                  <ResponsiveContainer width="100%" height={barChartH}>
                    <BarChart data={ancBookingTrend} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                      <XAxis dataKey="year" tick={axisTick} />
                      <YAxis tick={axisTick} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                      <Bar dataKey="value" fill={chart.c1} name="ANC bookings" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <ChartDataTable
                    caption="Total ANC bookings per year"
                    columns={["Year", "ANC bookings"]}
                    rows={ancBookingTrend.map((d) => [d.year, d.value.toLocaleString()])}
                  />
                </figure>
              </div>

              <div className="surface-panel rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "100ms" }}>
                <h3 className="text-xl font-bold text-foreground mb-6">1st-Trimester Booking (%)</h3>
                <figure role="group" aria-label="Percentage of pregnancies booked in the first trimester, 2019 to 2025">
                  <ResponsiveContainer width="100%" height={barChartH}>
                    <AreaChart data={firstTrimesterTrend} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="wchFirstTriGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chart.c4} stopOpacity={0.85} />
                          <stop offset="95%" stopColor={chart.c4} stopOpacity={0.15} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                      <XAxis dataKey="year" tick={axisTick} />
                      <YAxis domain={[70, 100]} tick={axisTick} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chart.c4}
                        fill="url(#wchFirstTriGrad)"
                        strokeWidth={3}
                        name="1st-trimester %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <ChartDataTable
                    caption="First-trimester booking percentage per year"
                    columns={["Year", "1st-trimester %"]}
                    rows={firstTrimesterTrend.map((d) => [d.year, `${d.value}%`])}
                  />
                </figure>
              </div>
            </div>

            {/* Maternal risk indicators */}
            <div className="surface-panel rounded-2xl p-8 animate-fadeInUp">
              <h3 className="text-xl font-bold text-foreground mb-6">Maternal Risk Indicators (%)</h3>
              <figure role="group" aria-label="Anemia in pregnancy and gestational diabetes percentages per year">
                <ResponsiveContainer width="100%" height={areaChartH}>
                  <LineChart data={maternalIndicators} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="year" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                    <Legend wrapperStyle={{ color: chart.axis }} />
                    <Line
                      type="monotone"
                      dataKey="anemia"
                      stroke={chart.c3}
                      strokeWidth={3}
                      dot={{ fill: chart.c3, r: 5 }}
                      name="Anemia %"
                    />
                    <Line
                      type="monotone"
                      dataKey="gdm"
                      stroke={chart.c2}
                      strokeWidth={3}
                      dot={{ fill: chart.c2, r: 5 }}
                      name="GDM %"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <ChartDataTable
                  caption="Anemia and gestational diabetes percentages per year"
                  columns={["Year", "Anemia %", "GDM %"]}
                  rows={maternalIndicators.map((d) => [d.year, `${d.anemia}%`, d.gdm === null ? "—" : `${d.gdm}%`])}
                />
              </figure>
            </div>

            {/* Family planning + premarital screening */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="surface-panel rounded-2xl p-6 animate-fadeInUp">
                <h3 className="text-xl font-bold text-foreground mb-6">Long-Acting Contraception Uptake (%)</h3>
                <figure role="group" aria-label="IUCD and Implanon uptake percentages per year, 2018 to 2025">
                  <ResponsiveContainer width="100%" height={barChartH}>
                    <BarChart data={contraceptionTrend} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                      <XAxis dataKey="year" tick={axisTick} />
                      <YAxis tick={axisTick} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                      <Legend wrapperStyle={{ color: chart.axis }} />
                      <Bar dataKey="iucd" fill={chart.c4} name="IUCD %" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="implanon" fill={chart.c6} name="Implanon %" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <ChartDataTable
                    caption="IUCD and Implanon uptake percentages per year"
                    columns={["Year", "IUCD %", "Implanon %"]}
                    rows={contraceptionTrend.map((d) => [d.year, `${d.iucd}%`, `${d.implanon}%`])}
                  />
                </figure>
              </div>

              <div className="surface-panel rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "100ms" }}>
                <h3 className="text-xl font-bold text-foreground mb-6">Premarital Screening (people screened)</h3>
                <figure role="group" aria-label="Number of people screened premaritally per year, 2019 to 2025">
                  <ResponsiveContainer width="100%" height={barChartH}>
                    <BarChart data={premaritalScreeningTrend} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                      <XAxis dataKey="year" tick={axisTick} />
                      <YAxis tick={axisTick} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                      <Bar dataKey="value" fill={chart.c1} name="People screened" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <ChartDataTable
                    caption="Premarital screening counts per year"
                    columns={["Year", "People screened"]}
                    rows={premaritalScreeningTrend.map((d) => [d.year, d.value.toLocaleString()])}
                  />
                </figure>
              </div>
            </div>

            {/* ASD developmental screening */}
            <div className="surface-panel rounded-2xl p-8 animate-fadeInUp">
              <h3 className="text-xl font-bold text-foreground mb-6">ASD Developmental Screening Coverage (%)</h3>
              <figure role="group" aria-label="Autism screening coverage at 18 and 24 months per year">
                <ResponsiveContainer width="100%" height={areaChartH}>
                  <LineChart data={asdScreeningTrend} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="year" tick={axisTick} />
                    <YAxis domain={[80, 100]} tick={axisTick} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                    <Legend wrapperStyle={{ color: chart.axis }} />
                    <Line
                      type="monotone"
                      dataKey="m18"
                      stroke={chart.c1}
                      strokeWidth={3}
                      dot={{ fill: chart.c1, r: 5 }}
                      name="18-month %"
                    />
                    <Line
                      type="monotone"
                      dataKey="m24"
                      stroke={chart.c2}
                      strokeWidth={3}
                      dot={{ fill: chart.c2, r: 5 }}
                      name="24-month %"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <ChartDataTable
                  caption="ASD screening coverage at 18 and 24 months per year"
                  columns={["Year", "18-month %", "24-month %"]}
                  rows={asdScreeningTrend.map((d) => [d.year, `${d.m18}%`, d.m24 === null ? "—" : `${d.m24}%`])}
                />
              </figure>
            </div>

            {/* Child safeguarding */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="surface-panel rounded-2xl p-6 animate-fadeInUp">
                <h3 className="text-xl font-bold text-foreground mb-6">Child Maltreatment — Reported Cases</h3>
                <figure role="group" aria-label="Reported child maltreatment cases per year, 2019 to 2025">
                  <ResponsiveContainer width="100%" height={barChartH}>
                    <BarChart data={childMaltreatmentTrend} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                      <XAxis dataKey="year" tick={axisTick} />
                      <YAxis tick={axisTick} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                      <Bar dataKey="value" fill={chart.c5} name="Cases" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <ChartDataTable
                    caption="Reported child maltreatment cases per year"
                    columns={["Year", "Cases"]}
                    rows={childMaltreatmentTrend.map((d) => [d.year, d.value.toLocaleString()])}
                  />
                </figure>
              </div>

              <div className="surface-panel rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "100ms" }}>
                <h3 className="text-xl font-bold text-foreground mb-6">Maltreatment by Type — 2024 vs 2025 (%)</h3>
                <figure role="group" aria-label="Child maltreatment by type, comparing 2024 and 2025 percentages">
                  <ResponsiveContainer width="100%" height={barChartH}>
                    <BarChart
                      data={maltreatmentByType}
                      margin={{ top: 10, right: 10, bottom: 60, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                      <XAxis dataKey="type" angle={-35} textAnchor="end" height={70} interval={0} tick={axisTick} />
                      <YAxis tick={axisTick} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chart.tipText }} />
                      <Legend wrapperStyle={{ color: chart.axis }} />
                      <Bar dataKey="y2024" fill={chart.c1} name="2024" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="y2025" fill={chart.c2} name="2025" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <ChartDataTable
                    caption="Child maltreatment by type, 2024 versus 2025 percentages"
                    columns={["Type", "2024 %", "2025 %"]}
                    rows={maltreatmentByType.map((d) => [d.type, `${d.y2024}%`, `${d.y2025}%`])}
                  />
                </figure>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card shadow-sm border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground mb-4 md:mb-0">
              <p className="font-medium text-foreground">© 2024 Ministry of Health, Sultanate of Oman</p>
              <p className="text-sm mt-1">LMWH Monitoring System - Maternal VTE Risk Assessment</p>
            </div>
            <div className="flex items-center space-x-6 text-muted-foreground">
              <span className="text-sm">Data Period: 2023-2024</span>
              <span className="text-sm">Total Records: 5,754</span>
              <span className="text-sm">7 Health Centers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
