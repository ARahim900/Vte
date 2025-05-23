"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("executive")
  const [hoveredMetric, setHoveredMetric] = useState(null)

  // Animated counter effect
  const AnimatedNumber = ({ value, duration = 2000, prefix = "", suffix = "" }) => {
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
      const numericValue = typeof value === "string" ? Number.parseFloat(value) || 0 : value || 0

      if (isNaN(numericValue)) {
        setDisplayValue(0)
        return
      }

      let startTime
      const animateValue = (timestamp) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const currentValue = Math.floor(progress * numericValue)
        setDisplayValue(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animateValue)
        }
      }

      requestAnimationFrame(animateValue)
    }, [value, duration])

    return (
      <>
        {prefix}
        {displayValue.toLocaleString()}
        {suffix}
      </>
    )
  }

  // Data based on analysis
  const totalStats = {
    totalWomen: 5754,
    year2023: 3282,
    year2024: 2472,
    womenWithRisk: Math.round(5754 * 0.372), // 37.2% of total
    ageAbove35: Math.round(5754 * 0.262), // 26.2% of total
    highRiskPatients: Math.round(5754 * 0.089), // 8.9% of total
  }

  const healthCenters = [
    { name: "SUHAR P.C", count: 2056, risk2023: 10.9, risk2024: 11.8 },
    { name: "AL MULTAQA", count: 1268, risk2023: 50.2, risk2024: 48.7 },
    { name: "TAREEF", count: 792, risk2023: 62.9, risk2024: 59.6 },
    { name: "FALAJ AL QABAIL", count: 774, risk2023: 53.0, risk2024: 51.5 },
    { name: "AL UWINAT", count: 727, risk2023: 59.3, risk2024: 73.1 },
    { name: "WADI HIBI", count: 197, risk2023: 0, risk2024: 0 },
    { name: "WADI AHIN", count: 100, risk2023: 0, risk2024: 66.7 },
  ]

  // Updated riskFactors data to include all factors
  const riskFactors = [
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

  // Monthly trends data
  const monthlyTrends = [
    { month: "Jan", screening: 87, treatment: 85, referrals: 12 },
    { month: "Feb", screening: 89, treatment: 87, referrals: 11 },
    { month: "Mar", screening: 91, treatment: 88, referrals: 13 },
    { month: "Apr", screening: 93, treatment: 86, referrals: 10 },
    { month: "May", screening: 92, treatment: 89, referrals: 12 },
    { month: "Jun", screening: 94, treatment: 90, referrals: 11 },
  ]

  // Risk factor count distribution
  const riskFactorCountDistribution = [
    { name: "1 Risk Factor", value: 49.2 },
    { name: "2 Risk Factors", value: 35.5 },
    { name: "3 Risk Factors", value: 10.1 },
    { name: "4 Risk Factors", value: 3.5 },
    { name: "5+ Risk Factors", value: 1.7 },
  ]

  // VTE Score Distribution
  const vteScoreDistribution = [
    { name: "Score 0-2 (Standard Care)", value: 84 },
    { name: "Score 3-4 (Consider Prophylaxis)", value: 12 },
    { name: "Score ≥5 (Prophylaxis Required)", value: 4 },
  ]

  // Tab configurations
  const tabs = [
    { id: "executive", label: "Executive Summary", icon: FileText },
    { id: "demographics", label: "Demographics", icon: Users },
    { id: "risk-center", label: "VTE Risk by Center", icon: BarChart3 },
    { id: "risk-factors", label: "Risk Factors", icon: AlertCircle },
    { id: "treatment", label: "Treatment & Medication", icon: Syringe },
    { id: "recommendations", label: "Recommendations", icon: Target },
  ]

  // Colors for charts
  const COLORS_LIGHT_FORMAL = [
    "#3498DB", // Blue
    "#1ABC9C", // Green
    "#9B59B6", // Purple
    "#E74C3C", // Red
    "#F1C40F", // Yellow
    "#2C3E50", // Dark Grey
    "#34495E", // Medium Grey
  ]

  // Custom MetricCard component
  const MetricCard = ({ icon, title, value, subtitle, trend, color, delay = 0 }) => (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 shadow-xl 
                  transform transition-all duration-500 hover:scale-105 hover:shadow-2xl
                  animate-fadeInUp`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setHoveredMetric(title)}
      onMouseLeave={() => setHoveredMetric(null)}
    >
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
        <div className={`w-full h-full rounded-full ${color} opacity-20 blur-2xl`} />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/50 backdrop-blur-sm rounded-xl">{icon}</div>
          {trend && (
            <div
              className={`flex items-center px-3 py-1 rounded-full text-sm font-medium
                          ${trend > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {trend > 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <h3 className="text-4xl font-bold text-gray-800 mb-2">
          {typeof value === "string" && value.includes("%") ? (
            <AnimatedNumber value={Number.parseFloat(value)} suffix="%" />
          ) : (
            <AnimatedNumber value={value} />
          )}
        </h3>
        <p className="text-gray-700 font-medium">{title}</p>
        {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans text-gray-800">
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out forwards;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(200, 200, 200, 0.5);
        }
      `}</style>

      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-6">
              <img src="/images/ministry-of-health-logo.png" alt="Ministry of Health" className="h-16 w-auto" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Maternal VTE Risk Assessment Report</h1>
              <p className="text-gray-600 text-sm">North Batinah Region - Sohar Wilayate Health Centers (2023-2024)</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                         whitespace-nowrap ${
                           selectedTab === tab.id
                             ? "bg-blue-600 text-white shadow-lg"
                             : "bg-white text-gray-700 hover:text-blue-700 hover:bg-gray-100 shadow-sm"
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
          <div className="space-y-8">
            {/* Study Overview */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Study Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                This report presents a comprehensive analysis of Venous Thromboembolism (VTE) risk assessment data for
                pregnant women in the North Batinah Region (NBR), specifically from the Wilayat of Sohar, for 2023 and
                2024. The analysis integrates data from both CSV datasets and Sohar P.C. records to provide a complete
                picture of maternal VTE risk factors and management trends.
              </p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                icon={<Users className="w-6 h-6 text-blue-800" />}
                title="Total Pregnant Women"
                value={totalStats.totalWomen}
                subtitle={`2023: ${totalStats.year2023} | 2024: ${totalStats.year2024}`}
                trend={52.8}
                color="from-blue-100 to-blue-200"
                delay={0}
              />
              <MetricCard
                icon={<Activity className="w-6 h-6 text-blue-800" />}
                title="Women with VTE Risk Factors"
                value={`${totalStats.womenWithRisk}`}
                subtitle="37.2% of total population"
                trend={-17.6}
                color="from-indigo-100 to-indigo-200"
                delay={100}
              />
              <MetricCard
                icon={<AlertCircle className="w-6 h-6 text-blue-800" />}
                title="Patients Age ≥35 years"
                value={`${totalStats.ageAbove35}`}
                subtitle="26.2% of total population"
                trend={0.3}
                color="from-green-100 to-green-200"
                delay={200}
              />
              <MetricCard
                icon={<Heart className="w-6 h-6 text-blue-800" />}
                title="High-Risk Patients"
                value={`${totalStats.highRiskPatients}`}
                subtitle="8.9% of total population"
                trend={-3.1}
                color="from-yellow-100 to-yellow-200"
                delay={300}
              />
              <MetricCard
                icon={<CheckCircle className="w-6 h-6 text-blue-800" />}
                title="VTE Screening Coverage"
                value="66.6"
                subtitle="Overall screening rate"
                trend={12.3}
                color="from-cyan-100 to-cyan-200"
                delay={400}
              />
              <MetricCard
                icon={<Syringe className="w-6 h-6 text-blue-800" />}
                title="Treatment Coverage"
                value="75.3"
                subtitle="High-risk patients treated"
                trend={-11.6}
                color="from-rose-100 to-rose-200"
                delay={500}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Center Distribution */}
              <div className="glass-effect rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
                <h3 className="text-xl font-bold text-gray-800 mb-6">VTE Risk by Health Center (%)</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={healthCenters} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                    <defs>
                      <linearGradient id="colorGradient2023" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3498DB" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#3498DB" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="colorGradient2024" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1ABC9C" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#1ABC9C" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      tick={{ fill: "#4A5568", fontSize: 12 }}
                      height={80}
                      interval={0}
                    />
                    <YAxis tick={{ fill: "#4A5568" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid rgba(0,0,0,0.15)",
                        borderRadius: "8px",
                        color: "#333",
                      }}
                      labelStyle={{ color: "#333" }}
                    />
                    <Legend wrapperStyle={{ color: "#4A5568" }} />
                    <Bar dataKey="risk2023" fill="url(#colorGradient2023)" name="2023" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="risk2024" fill="url(#colorGradient2024)" name="2024" radius={[8, 8, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Data Source Distribution */}
              <div className="glass-effect rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "700ms" }}>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Data Source Distribution</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={healthCenters}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {healthCenters.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_LIGHT_FORMAL[index % COLORS_LIGHT_FORMAL.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid rgba(0,0,0,0.15)",
                        borderRadius: "8px",
                        color: "#333",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#4A5568" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Important Note */}
            <div
              className="glass-effect rounded-2xl p-6 border-l-4 border-yellow-600 animate-fadeInUp"
              style={{ animationDelay: "800ms" }}
            >
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Important Note on Data Collection</h4>
                  <p className="text-gray-700">
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
          <div className="space-y-8">
            {/* Age Distribution */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Age Distribution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[
                    { age: "<20", value2023: 4.2, value2024: 4.0 },
                    { age: "20-24", value2023: 15.6, value2024: 15.8 },
                    { age: "25-29", value2023: 27.3, value2024: 27.1 },
                    { age: "30-34", value2023: 28.9, value2024: 28.5 },
                    { age: "35-39", value2023: 18.3, value2024: 18.6 },
                    { age: "40+", value2023: 7.6, value2024: 7.5 },
                  ]}
                >
                  <defs>
                    <linearGradient id="ageGrad2023" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3498DB" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#3498DB" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="ageGrad2024" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1ABC9C" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#1ABC9C" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="age" tick={{ fill: "#4A5568" }} />
                  <YAxis tick={{ fill: "#4A5568" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: "8px",
                      color: "#333",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#4A5568" }} />
                  <Bar dataKey="value2023" fill="url(#ageGrad2023)" name="2023" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="value2024" fill="url(#ageGrad2024)" name="2024" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-gray-700 mt-4 text-center">
                Women aged 30-34 represent the largest age group, while the proportion of women aged ≥35 years
                (high-risk category) shows a slight increase from 25.9% to 26.2%.
              </p>
            </div>

            {/* Booking Trimester Distribution */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "200ms" }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Booking Trimester Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={[
                    { trimester: "First", value2023: 92.1, value2024: 91.8 },
                    { trimester: "Second", value2023: 6.2, value2024: 6.5 },
                    { trimester: "Third", value2023: 1.7, value2024: 1.7 },
                  ]}
                >
                  <defs>
                    <linearGradient id="trimesterGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3498DB" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#3498DB" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="trimester" tick={{ fill: "#4A5568" }} />
                  <YAxis tick={{ fill: "#4A5568" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: "8px",
                      color: "#333",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value2023"
                    stroke="#3498DB"
                    fill="url(#trimesterGradient)"
                    strokeWidth={3}
                    name="2023"
                  />
                  <Area
                    type="monotone"
                    dataKey="value2024"
                    stroke="#1ABC9C"
                    fill="url(#trimesterGradient)"
                    strokeWidth={3}
                    name="2024"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-gray-700 mt-4 text-center">
                First trimester booking rates remain consistently high across both years, indicating excellent early
                prenatal care access.
              </p>
            </div>
          </div>
        )}

        {selectedTab === "risk-center" && (
          <div className="space-y-8">
            {/* Risk Trend Chart */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">VTE Risk by Center</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={healthCenters}>
                  <defs>
                    <linearGradient id="lineGrad2023" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3498DB" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#2C3E50" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="lineGrad2024" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1ABC9C" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#2ECC71" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    tick={{ fill: "#4A5568", fontSize: 12 }}
                    height={80}
                    interval={0}
                  />
                  <YAxis tick={{ fill: "#4A5568" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: "8px",
                      color: "#333",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#4A5568" }} />
                  <Line
                    type="monotone"
                    dataKey="risk2023"
                    stroke="url(#lineGrad2023)"
                    strokeWidth={3}
                    dot={{ fill: "#3498DB", r: 6 }}
                    name="2023"
                  />
                  <Line
                    type="monotone"
                    dataKey="risk2024"
                    stroke="url(#lineGrad2024)"
                    strokeWidth={3}
                    dot={{ fill: "#1ABC9C", r: 6 }}
                    name="2024"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Health Center Table */}
            <div
              className="glass-effect rounded-2xl overflow-hidden animate-fadeInUp"
              style={{ animationDelay: "200ms" }}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Health Center Risk Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Health Center
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Total Records
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Risk % 2023
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Risk % 2024
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {healthCenters.map((center, index) => (
                      <tr key={center.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: COLORS_LIGHT_FORMAL[index % COLORS_LIGHT_FORMAL.length] }}
                            />
                            <span className="text-sm font-medium text-gray-800">{center.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {center.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{center.risk2023}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{center.risk2024}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              center.risk2024 > center.risk2023
                                ? "bg-red-100 text-red-800"
                                : center.risk2024 < center.risk2023
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {center.risk2024 > center.risk2023 && "+"}
                            {(center.risk2024 - center.risk2023).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Critical Observations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="glass-effect rounded-2xl p-6 border-l-4 border-red-600 animate-fadeInUp"
                style={{ animationDelay: "400ms" }}
              >
                <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                  Highest Risk Center
                </h4>
                <p className="text-gray-700">
                  AL UWINAT H/C shows the highest VTE risk in both years (59.3% → 73.1%) with the most significant
                  increase (+13.8%)
                </p>
              </div>

              <div
                className="glass-effect rounded-2xl p-6 border-l-4 border-blue-600 animate-fadeInUp"
                style={{ animationDelay: "500ms" }}
              >
                <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  New Centers
                </h4>
                <p className="text-gray-700">
                  Two new centers were added in 2024: WADI AHIN with high risk (66.7%) and WADI HIBI with zero recorded
                  risk
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "risk-factors" && (
          <div className="space-y-8">
            {/* Risk Factors Distribution */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Risk Factors Distribution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={riskFactors.slice(0, 7)} layout="horizontal">
                  <defs>
                    <linearGradient id="riskGrad2023" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3498DB" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#2980B9" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="riskGrad2024" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1ABC9C" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#16A085" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis type="number" domain={[0, 35]} tick={{ fill: "#4A5568" }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#4A5568" }} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: "8px",
                      color: "#333",
                    }}
                    formatter={(value) => [`${value}%`, ""]}
                  />
                  <Legend wrapperStyle={{ color: "#4A5568" }} />
                  <Bar dataKey="value2023" name="2023" radius={[0, 8, 8, 0]}>
                    {riskFactors.slice(0, 7).map((entry, index) => (
                      <Cell key={`cell-2023-${index}`} fill="url(#riskGrad2023)" />
                    ))}
                  </Bar>
                  <Bar dataKey="value2024" name="2024" radius={[0, 8, 8, 0]}>
                    {riskFactors.slice(0, 7).map((entry, index) => (
                      <Cell key={`cell-2024-${index}`} fill="url(#riskGrad2024)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Factor Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {riskFactors.slice(0, 6).map((factor, index) => {
                const Icon = factor.icon
                const change = factor.value2024 - factor.value2023
                return (
                  <div
                    key={factor.name}
                    className="glass-effect rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeInUp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${
                          change > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {change > 0 ? "+" : ""}
                        {change.toFixed(1)}%
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{factor.name}</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">2023: {factor.value2023}%</span>
                      <span className="text-gray-700">2024: {factor.value2024}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Risk Factor Count Distribution Pie Chart */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Number of Risk Factors per Patient (2024)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={riskFactorCountDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {riskFactorCountDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_LIGHT_FORMAL[index % COLORS_LIGHT_FORMAL.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: "8px",
                      color: "#333",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-gray-700 text-center mt-4">
                This chart shows the distribution of patients based on the number of VTE risk factors identified.
              </p>
            </div>

            {/* VTE Score Distribution Pie Chart */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "700ms" }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">VTE Score Distribution (2024)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={vteScoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {vteScoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_LIGHT_FORMAL[index % COLORS_LIGHT_FORMAL.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: "8px",
                      color: "#333",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-gray-700 text-center mt-4">
                Patients with 3 or more risk factors (15.2% of at-risk patients) should be prioritized for
                thromboprophylaxis and require close monitoring throughout pregnancy.
              </p>
            </div>
          </div>
        )}

        {selectedTab === "treatment" && (
          <div className="space-y-8">
            {/* Treatment Coverage Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-effect rounded-2xl p-8 animate-fadeInUp">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">2023 Treatment Coverage</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Receiving Treatment", value: 87.1 },
                        { name: "Treatment Gap", value: 12.9 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      startAngle={90}
                      endAngle={450}
                    >
                      <Cell fill="#1ABC9C" />
                      <Cell fill="#E74C3C" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid rgba(0,0,0,0.15)",
                        borderRadius: "8px",
                        color: "#333",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">87.1%</p>
                  <p className="text-gray-700">Receiving Treatment</p>
                </div>
              </div>

              <div className="glass-effect rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "200ms" }}>
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">2024 Treatment Coverage</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Receiving Treatment", value: 63.5 },
                        { name: "Treatment Gap", value: 36.5 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      startAngle={90}
                      endAngle={450}
                    >
                      <Cell fill="#1ABC9C" />
                      <Cell fill="#E74C3C" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid rgba(0,0,0,0.15)",
                        borderRadius: "8px",
                        color: "#333",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">63.5%</p>
                  <p className="text-gray-700">Receiving Treatment</p>
                </div>
              </div>
            </div>

            {/* Treatment Trends */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Monthly Treatment & Screening Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="screeningGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3498DB" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#3498DB" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="treatmentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1ABC9C" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#1ABC9C" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: "#4A5568" }} />
                  <YAxis tick={{ fill: "#4A5568" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: "8px",
                      color: "#333",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#4A5568" }} />
                  <Area
                    type="monotone"
                    dataKey="screening"
                    stroke="#3498DB"
                    fill="url(#screeningGrad)"
                    strokeWidth={3}
                    name="Screening %"
                  />
                  <Area
                    type="monotone"
                    dataKey="treatment"
                    stroke="#1ABC9C"
                    fill="url(#treatmentGrad)"
                    strokeWidth={3}
                    name="Treatment %"
                  />
                  <Line
                    type="monotone"
                    dataKey="referrals"
                    stroke="#F1C40F"
                    strokeWidth={3}
                    dot={{ fill: "#F1C40F", r: 6 }}
                    name="Referrals %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* VTE Score Availability */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">VTE Score Availability</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium text-gray-800">At Booking</span>
                    <span className="text-sm text-green-600">+6.2%</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div className="absolute inset-0 flex items-center justify-between px-4 text-sm text-gray-800">
                        <span>2023: 66.6%</span>
                        <span>2024: 66.6%</span>
                      </div>
                      <div
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 h-8 rounded-full transition-all duration-1000"
                        style={{ width: "66.6%" }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium text-gray-800">At 28 Weeks</span>
                    <span className="text-sm text-green-600">Significant improvement</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div className="absolute inset-0 flex items-center justify-between px-4 text-sm text-gray-800">
                        <span>2023: N/A</span>
                        <span>2024: 42.5%</span>
                      </div>
                      <div
                        className="bg-gradient-to-r from-orange-600 to-red-600 h-8 rounded-full transition-all duration-1000"
                        style={{ width: "42.5%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>Significant Improvement:</strong> VTE scoring at 28 weeks has reached 87.0% in 2024, showing
                  excellent progress in follow-up assessment. This is a major positive finding from the combined
                  dataset.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "recommendations" && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center animate-fadeInUp">Key Recommendations</h2>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  number: 1,
                  title: "Standardize data integration across sources",
                  description:
                    "Develop a unified data collection system that integrates CSV and Sohar P.C. records with consistent fields, definitions, and coding to enable more accurate comparisons and trend analysis.",
                  icon: FileText,
                  color: "from-blue-100 to-blue-200",
                },
                {
                  number: 2,
                  title: "Address treatment gap",
                  description:
                    "Investigate and address the decrease in treatment coverage for high-risk patients (87.1% to 63.5%). Implement protocols to ensure all high-risk patients receive appropriate medication across all health centers, especially focusing on new centers.",
                  icon: Syringe,
                  color: "from-indigo-100 to-indigo-200",
                },
                {
                  number: 3,
                  title: "Maintain 28-week VTE assessment success",
                  description:
                    "Build on the significant improvement in 28-week assessment (now at 87.0%) by implementing a standardized protocol across all centers and targeting 95%+ coverage in future years.",
                  icon: Target,
                  color: "from-green-100 to-green-200",
                },
                {
                  number: 4,
                  title: "Target high-risk centers",
                  description:
                    "Implement specialized VTE risk reduction programs at AL UWINAT H/C and WADI AHIN, which show the highest risk percentages. Investigate why WADI HIBI reports zero VTE risk and verify data collection practices.",
                  icon: AlertCircle,
                  color: "from-yellow-100 to-yellow-200",
                },
              ].map((rec, index) => (
                <div
                  key={rec.number}
                  className={`glass-effect rounded-2xl p-8 hover:scale-105 transition-all duration-300 
                                animate-fadeInUp bg-gradient-to-br ${rec.color}`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-start">
                    <div className="p-3 bg-white/50 rounded-xl mr-4">
                      <rec.icon className="w-6 h-6 text-blue-800" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        {rec.number}. {rec.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Expected Outcomes */}
            <div className="glass-effect rounded-2xl p-8 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Expected Outcomes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Improved Data Quality</h4>
                  <ul className="text-gray-700 text-sm space-y-2">
                    <li>• Unified data collection system</li>
                    <li>• Standardized risk factor documentation</li>
                    <li>• 95%+ data completion rates</li>
                    <li>• Integrated health center reporting</li>
                  </ul>
                </div>

                <div className="text-center">
                  <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Reduced VTE Risk</h4>
                  <ul className="text-gray-700 text-sm space-y-2">
                    <li>• Enhanced risk assessment tools</li>
                    <li>• 28-week assessment rate {" > "} 95%</li>
                    <li>• Targeted interventions at high-risk centers</li>
                    <li>• Standardized prophylaxis protocols</li>
                  </ul>
                </div>

                <div className="text-center">
                  <div className="p-4 bg-gradient-to-br from-rose-600 to-red-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Better Patient Outcomes</h4>
                  <ul className="text-gray-700 text-sm space-y-2">
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
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-md border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-700 mb-4 md:mb-0">
              <p className="font-medium">© 2024 Ministry of Health, Sultanate of Oman</p>
              <p className="text-sm mt-1">LMWH Monitoring System - Maternal VTE Risk Assessment</p>
            </div>
            <div className="flex items-center space-x-6 text-gray-700">
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
