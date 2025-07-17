import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RiskFactorData {
  ageGroup: string;
  count: number;
  percentage: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

const RiskFactorAge: React.FC = () => {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const totalPatients = 1247;

  const riskFactorData: RiskFactorData[] = [
    { ageGroup: '18-30', count: 156, percentage: 12.5, riskLevel: 'Low' },
    { ageGroup: '31-45', count: 324, percentage: 26.0, riskLevel: 'Medium' },
    { ageGroup: '46-60', count: 421, percentage: 33.8, riskLevel: 'High' },
    { ageGroup: '61-75', count: 286, percentage: 22.9, riskLevel: 'High' },
    { ageGroup: '76+', count: 60, percentage: 4.8, riskLevel: 'Medium' },
  ];

  const getBadgeVariant = (riskLevel: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (riskLevel) {
      case 'Low': return 'default';
      case 'Medium': return 'secondary';
      case 'High': return 'destructive';
      default: return 'outline';
    }
  };

  const handleBarClick = (data: any) => {
    setSelectedAgeGroup(data.ageGroup);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{`Age Group: ${label}`}</p>
          <p className="text-blue-600">{`Patients: ${data.count}`}</p>
          <p className="text-gray-600">{`Percentage: ${data.percentage}%`}</p>
          <p className="text-gray-600">{`Risk Level: ${data.riskLevel}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Risk Factor Analysis by Age</h2>
          <p className="text-gray-600 mt-1">
            Distribution of {totalPatients.toLocaleString()} patients across age groups
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Total Patients: {totalPatients.toLocaleString()}
        </Badge>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Age Group Distribution</CardTitle>
          <CardDescription>
            Click on any bar to view detailed risk analysis for that age group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskFactorData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageGroup" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  onClick={handleBarClick}
                  cursor="pointer"
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Age Group Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {riskFactorData.map((group) => (
          <Card 
            key={group.ageGroup} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedAgeGroup === group.ageGroup ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedAgeGroup(group.ageGroup)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{group.ageGroup}</CardTitle>
                <Badge variant={getBadgeVariant(group.riskLevel)}>
                  {group.riskLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-gray-900">
                  {group.count.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  {group.percentage}% of total patients
                </div>
                <Progress 
                  value={group.percentage} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Age Group Details */}
      {selectedAgeGroup && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analysis - Age Group {selectedAgeGroup}</CardTitle>
            <CardDescription>
              Risk assessment details for selected age group
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedData = riskFactorData.find(group => group.ageGroup === selectedAgeGroup);
              if (!selectedData) return null;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Patient Count</p>
                    <p className="text-3xl font-bold">{selectedData.count.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Percentage</p>
                    <p className="text-3xl font-bold">{selectedData.percentage}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Risk Level</p>
                    <Badge variant={getBadgeVariant(selectedData.riskLevel)} className="text-lg px-3 py-1">
                      {selectedData.riskLevel}
                    </Badge>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RiskFactorAge;