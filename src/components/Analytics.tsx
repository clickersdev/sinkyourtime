import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Zap,
  Award,
  CalendarDays,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useProjectStore } from "../stores/projectStore";
import { sessionService } from "../services/database";
import { fadeIn } from "../utils/animations";
import type { TimerSession, Project } from "../types";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#84cc16",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

interface AnalyticsProps {
  projectId?: string;
}

interface TimeRange {
  label: string;
  value: "today" | "week" | "month" | "quarter" | "year";
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: "Today", value: "today", days: 1 },
  { label: "7 Days", value: "week", days: 7 },
  { label: "30 Days", value: "month", days: 30 },
  { label: "90 Days", value: "quarter", days: 90 },
  { label: "1 Year", value: "year", days: 365 },
];

const Analytics: React.FC<AnalyticsProps> = ({ projectId }) => {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[1]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBreaks, setShowBreaks] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(
    projectId || null
  );
  const { projects, loadProjects, currentProject } = useProjectStore();

  // GSAP refs
  const chartsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Load projects if not already loaded
  useEffect(() => {
    if (projects.length === 0) {
      loadProjects();
    }
  }, [projects.length, loadProjects]);

  // Load sessions when component mounts or dependencies change
  useEffect(() => {
    loadSessions();
  }, [timeRange, selectedProject, projects.length]);

  // GSAP animations
  useEffect(() => {
    if (statsRef.current) {
      fadeIn(statsRef.current);
    }
    if (chartsRef.current) {
      fadeIn(chartsRef.current, 0.3);
    }
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);

      // Get all sessions first
      const allSessions = await sessionService.getAll();

      // Filter by date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange.days);

      const dateFilteredSessions = allSessions.filter((session) => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      // Filter by project if specified
      const finalSessions = selectedProject
        ? dateFilteredSessions.filter(
            (session) => session.projectId === selectedProject
          )
        : dateFilteredSessions;

      setSessions(finalSessions);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized analytics calculations
  const analyticsData = useMemo(() => {
    const workSessions = sessions.filter((s) => s.type === "work");
    const breakSessions = sessions.filter((s) => s.type !== "work");
    const allSessions = showBreaks ? sessions : workSessions;

    // Calculate total focused time in minutes
    const totalFocusedTime = workSessions.reduce((sum, session) => {
      return sum + session.actualDuration / (1000 * 60);
    }, 0);

    const totalBreakTime = breakSessions.reduce((sum, session) => {
      return sum + session.actualDuration / (1000 * 60);
    }, 0);

    const completedSessions = workSessions.filter((s) => s.completed).length;
    const averageSessionLength =
      workSessions.length > 0 ? totalFocusedTime / workSessions.length : 0;
    const completionRate =
      workSessions.length > 0
        ? (completedSessions / workSessions.length) * 100
        : 0;

    // Productivity score (based on completion rate and consistency)
    const productivityScore = Math.min(
      100,
      Math.round(
        completionRate * 0.6 + Math.min(workSessions.length / 10, 1) * 40
      )
    );

    // Project breakdown
    const projectBreakdown = projects
      .map((project) => {
        const projectSessions = workSessions.filter(
          (s) => s.projectId === project.id
        );
        const totalTime = projectSessions.reduce((sum, session) => {
          return sum + session.actualDuration / (1000 * 60);
        }, 0);

        return {
          name: project.name,
          time: Math.round(totalTime),
          sessions: projectSessions.length,
          color: project.color,
          completionRate:
            projectSessions.length > 0
              ? (projectSessions.filter((s) => s.completed).length /
                  projectSessions.length) *
                100
              : 0,
        };
      })
      .filter((p) => p.time > 0)
      .sort((a, b) => b.time - a.time);

    // Category breakdown
    const categoryMap = new Map();
    workSessions.forEach((session) => {
      const project = projects.find((p) => p.id === session.projectId);
      const category = project?.categories.find(
        (c) => c.id === session.categoryId
      );

      if (category) {
        const sessionTime = session.actualDuration / (1000 * 60);
        const existing = categoryMap.get(category.id);

        if (existing) {
          existing.time += sessionTime;
          existing.sessions += 1;
          existing.completed += session.completed ? 1 : 0;
        } else {
          categoryMap.set(category.id, {
            name: category.name,
            time: sessionTime,
            sessions: 1,
            completed: session.completed ? 1 : 0,
          });
        }
      }
    });

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((cat) => ({
        ...cat,
        time: Math.round(cat.time),
        completionRate:
          cat.sessions > 0 ? (cat.completed / cat.sessions) * 100 : 0,
      }))
      .filter((cat) => cat.time > 0)
      .sort((a, b) => b.time - a.time);

    // Daily breakdown with more detailed data
    const dailyMap = new Map();
    allSessions.forEach((session) => {
      const date = new Date(session.startTime).toLocaleDateString();
      const sessionTime = session.actualDuration / (1000 * 60);
      const existing = dailyMap.get(date);

      if (existing) {
        existing.time += sessionTime;
        existing.sessions += 1;
        if (session.type === "work") {
          existing.workTime += sessionTime;
          existing.workSessions += 1;
        } else {
          existing.breakTime += sessionTime;
          existing.breakSessions += 1;
        }
      } else {
        dailyMap.set(date, {
          date,
          time: sessionTime,
          sessions: 1,
          workTime: session.type === "work" ? sessionTime : 0,
          workSessions: session.type === "work" ? 1 : 0,
          breakTime: session.type !== "work" ? sessionTime : 0,
          breakSessions: session.type !== "work" ? 1 : 0,
        });
      }
    });

    const dailyBreakdown = Array.from(dailyMap.values())
      .map((day) => ({ ...day, time: Math.round(day.time) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Hourly distribution
    const hourlyMap = new Map();
    workSessions.forEach((session) => {
      const hour = new Date(session.startTime).getHours();
      const sessionTime = session.actualDuration / (1000 * 60);
      const existing = hourlyMap.get(hour);

      if (existing) {
        existing.time += sessionTime;
        existing.sessions += 1;
      } else {
        hourlyMap.set(hour, {
          hour: `${hour}:00`,
          time: sessionTime,
          sessions: 1,
        });
      }
    });

    const hourlyBreakdown = Array.from(hourlyMap.values())
      .map((hour) => ({ ...hour, time: Math.round(hour.time) }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    return {
      totalFocusedTime: Math.round(totalFocusedTime),
      totalBreakTime: Math.round(totalBreakTime),
      completedSessions,
      totalSessions: workSessions.length,
      averageSessionLength: Math.round(averageSessionLength),
      completionRate: Math.round(completionRate),
      productivityScore,
      projectBreakdown,
      categoryBreakdown,
      dailyBreakdown,
      hourlyBreakdown,
      workSessions,
      breakSessions,
    };
  }, [sessions, projects, showBreaks]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTimeShort = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const handleExportData = () => {
    const data = {
      timeRange: timeRange.label,
      date: new Date().toISOString(),
      analytics: analyticsData,
      sessions: sessions,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeRange.value}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {selectedProject ? "Project Analytics" : "Analytics Dashboard"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your productivity and time management insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Filter */}
          {!projectId && (
            <select
              value={selectedProject || ""}
              onChange={(e) => setSelectedProject(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}

          {/* Time Range Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange.value === range.value
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Toggle Breaks */}
          <button
            onClick={() => setShowBreaks(!showBreaks)}
            className={`p-2 rounded-lg transition-colors ${
              showBreaks
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title={showBreaks ? "Hide break sessions" : "Show break sessions"}
          >
            {showBreaks ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportData}
            className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            title="Export analytics data"
          >
            <Download size={16} />
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadSessions}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div
        ref={statsRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Total Focus Time
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {formatTimeShort(analyticsData.totalFocusedTime)}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {analyticsData.totalSessions} sessions
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Completion Rate
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {analyticsData.completionRate}%
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {analyticsData.completedSessions} completed
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-xl">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Avg Session
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {analyticsData.averageSessionLength}m
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                per session
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Productivity
              </p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {analyticsData.productivityScore}
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                score
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-xl">
              <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Breakdown */}
        {!selectedProject && analyticsData.projectBreakdown.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Time by Project
              </h3>
              <div className="text-sm text-gray-500">
                {formatTime(
                  analyticsData.projectBreakdown.reduce(
                    (sum, p) => sum + p.time,
                    0
                  )
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.projectBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="time"
                >
                  {analyticsData.projectBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} minutes`, "Time"]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Breakdown */}
        {analyticsData.categoryBreakdown.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Time by Category
              </h3>
              <div className="text-sm text-gray-500">
                {formatTime(
                  analyticsData.categoryBreakdown.reduce(
                    (sum, c) => sum + c.time,
                    0
                  )
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [`${value} minutes`, "Time"]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="time" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Daily Progress Chart */}
      {analyticsData.dailyBreakdown.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Daily Progress
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Work Time
                </span>
              </div>
              {showBreaks && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Break Time
                  </span>
                </div>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [
                  `${value} minutes`,
                  name === "workTime" ? "Work Time" : "Break Time",
                ]}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="workTime"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              {showBreaks && (
                <Area
                  type="monotone"
                  dataKey="breakTime"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hourly Distribution */}
      {analyticsData.hourlyBreakdown.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Hourly Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.hourlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [`${value} minutes`, "Time"]}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="time" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* No Data State */}
      {sessions.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            No data available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {selectedProject
              ? "Start your first Pomodoro session for this project to see analytics here."
              : "Start your first Pomodoro session to see your productivity insights and trends."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Start a Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
