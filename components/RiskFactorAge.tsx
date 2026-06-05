'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Users } from 'lucide-react';

interface AgeDatum {
  ageGroup: string;
  percentage: number;
  risk: string;
}

// Risk Factor Age Data
const ageData: AgeDatum[] = [
  { ageGroup: '<18', percentage: 2, risk: 'Low' },
  { ageGroup: '18-30', percentage: 8, risk: 'Low' },
  { ageGroup: '31-40', percentage: 15, risk: 'Moderate' },
  { ageGroup: '41-50', percentage: 25, risk: 'Moderate' },
  { ageGroup: '51-60', percentage: 35, risk: 'High' },
  { ageGroup: '61-70', percentage: 45, risk: 'High' },
  { ageGroup: '71-80', percentage: 55, risk: 'Very High' },
  { ageGroup: '>80', percentage: 65, risk: 'Very High' },
];

export const RiskFactorAge: React.FC = () => {
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  // Resolve chart colours from design tokens so the chart tracks light/dark themes.
  // Severity tokens (success/warning/destructive) let each bar's colour encode the
  // row's `risk` band, matching the three summary cards above the chart.
  interface ChartColors {
    success: string;
    warning: string;
    destructive: string;
    axis: string;
    grid: string;
    tipBg: string;
    tipBorder: string;
    tipText: string;
  }

  const [chartColors, setChartColors] = useState<ChartColors>({
    success: 'hsl(150 55% 34%)',
    warning: 'hsl(38 78% 36%)',
    destructive: 'hsl(350 80% 45%)',
    axis: 'hsl(220 9% 42%)',
    grid: 'hsl(210 24% 88%)',
    tipBg: 'hsl(0 0% 100%)',
    tipBorder: 'hsl(210 24% 88%)',
    tipText: 'hsl(204 34% 15%)',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cs = getComputedStyle(document.documentElement);
    const hsl = (name: string) => `hsl(${cs.getPropertyValue(name).trim()})`;
    setChartColors({
      success: hsl('--success'),
      warning: hsl('--warning'),
      destructive: hsl('--destructive'),
      axis: hsl('--muted-foreground'),
      grid: hsl('--border'),
      tipBg: hsl('--popover'),
      tipBorder: hsl('--border'),
      tipText: hsl('--popover-foreground'),
    });
  }, []);

  // Map a row's risk band onto a severity token. Low -> success, Moderate ->
  // warning, High/Very High -> destructive (the chart has no fourth hue band;
  // Very High shares the High/destructive colour, matching the >50yr card).
  const riskFill = (risk: string): string => {
    if (risk === 'Low') return chartColors.success;
    if (risk === 'Moderate') return chartColors.warning;
    return chartColors.destructive;
  };

  // Recharts hands the bar's original row back on `payload`.
  const handleBarClick = (data: { payload?: AgeDatum }) => {
    if (data?.payload?.ageGroup) {
      setSelectedAge(data.payload.ageGroup);
    }
  };

  const selected = ageData.find((d) => d.ageGroup === selectedAge);

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info-soft text-info">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Age Distribution Risk Analysis</h2>
              <p className="text-sm text-muted-foreground mt-1">VTE risk increases significantly with age</p>
            </div>
          </div>
        </div>

        {/* Age Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-success-soft p-4 rounded-lg border border-success/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success">Low Risk Ages</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">&lt;30 years</p>
                <p className="text-xs text-muted-foreground mt-1">2-8% risk level</p>
              </div>
              <Activity className="h-8 w-8 text-success opacity-70" />
            </div>
          </div>

          <div className="bg-warning-soft p-4 rounded-lg border border-warning/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warning">Moderate Risk Ages</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">31-50 years</p>
                <p className="text-xs text-muted-foreground mt-1">15-25% risk level</p>
              </div>
              <TrendingUp className="h-8 w-8 text-warning opacity-70" />
            </div>
          </div>

          <div className="bg-destructive-soft p-4 rounded-lg border border-destructive/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">High Risk Ages</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">&gt;50 years</p>
                <p className="text-xs text-muted-foreground mt-1">35-65% risk level</p>
              </div>
              <Activity className="h-8 w-8 text-destructive opacity-70" />
            </div>
          </div>
        </div>

        {/* Interactive Bar Chart */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">Risk Percentage by Age Group</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="ageGroup" stroke={chartColors.axis} tick={{ fill: chartColors.axis }} />
              <YAxis
                stroke={chartColors.axis}
                tick={{ fill: chartColors.axis }}
                label={{ value: 'Risk %', angle: -90, position: 'insideLeft', fill: chartColors.axis }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartColors.tipBg,
                  border: `1px solid ${chartColors.tipBorder}`,
                  borderRadius: '8px',
                  color: chartColors.tipText,
                }}
                cursor={{ fill: 'hsl(var(--muted-foreground) / 0.1)' }}
              />
              <Bar
                dataKey="percentage"
                radius={[6, 6, 0, 0]}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
                {ageData.map((d) => (
                  <Cell key={d.ageGroup} fill={riskFill(d.risk)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Age Details */}
        {selected && (
          <div className="mt-6 p-4 bg-info-soft rounded-lg border border-info/30">
            <h4 className="font-semibold text-info mb-2">Selected Age Group: {selected.ageGroup}</h4>
            <p className="text-sm text-foreground">
              {selected.risk} risk level with {selected.percentage}% probability
            </p>
          </div>
        )}

        {/* Risk Factors by Age */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Age-Related Risk Factors</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-success rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Young Adults (18-30)</p>
                <p className="text-sm text-muted-foreground">
                  Lower baseline risk, but increases with oral contraceptives, pregnancy, or prolonged immobility
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-warning rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Middle Age (31-50)</p>
                <p className="text-sm text-muted-foreground">
                  Risk increases with obesity, sedentary lifestyle, and chronic conditions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-destructive rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Older Adults (&gt;50)</p>
                <p className="text-sm text-muted-foreground">
                  Significantly elevated risk due to decreased mobility, multiple comorbidities, and age-related changes
                  in blood
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Implications */}
        <div className="mt-6 p-4 bg-warning-soft rounded-lg border border-warning/30">
          <h4 className="font-semibold text-warning mb-2">Clinical Implications</h4>
          <ul className="space-y-2 text-sm text-foreground">
            <li>• Age is one of the strongest non-modifiable risk factors for VTE</li>
            <li>• Risk doubles with each decade after age 40</li>
            <li>• Prophylaxis strategies should be age-adjusted</li>
            <li>• Elderly patients require careful monitoring due to bleeding risks</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
