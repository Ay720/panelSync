import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import api from '../services/api';

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/detailed');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Scheduling Intelligence & Analytics
        </h2>
        <p className="text-slate-500 text-xs md:text-sm">
          Metrics on interviewer load balancing, round distribution, and schedule efficiency.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" count={2} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interviewer Workload Distribution */}
          <Card>
            <CardHeader
              title="Interviewer Workload Distribution"
              subtitle="Total interview loops conducted per panelist"
            />
            <CardContent className="space-y-4">
              {data?.interviewerWorkload?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No workload data yet.</p>
              ) : (
                data?.interviewerWorkload?.map((inv) => {
                  const maxCount = Math.max(...data.interviewerWorkload.map((i) => i.interviewCount), 1);
                  const pct = Math.round((inv.interviewCount / maxCount) * 100);

                  return (
                    <div key={inv.interviewerId} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{inv.name}</span>
                          <span className="text-slate-400 text-[11px] ml-1.5">({inv.department})</span>
                        </div>
                        <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          {inv.interviewCount} sessions
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Interview Rounds Breakdown */}
          <Card>
            <CardHeader
              title="Interviews by Round Type"
              subtitle="Distribution of evaluation stages"
            />
            <CardContent className="space-y-3">
              {data?.byRoundType?.map((item) => (
                <div
                  key={item._id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                    <span className="font-bold text-slate-800 capitalize">
                      {item._id.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                    {item.count} interviews
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Past 7 Days Scheduling Trend */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Recent Scheduling Velocity"
              subtitle="New sessions booked over the past 7 days"
            />
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center pt-2">
                {data?.trendsPastWeek?.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 mb-1">{d.date}</p>
                    <p className="text-xl font-black text-brand-700">{d.count}</p>
                    <span className="text-[10px] text-slate-500">sessions</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics;

