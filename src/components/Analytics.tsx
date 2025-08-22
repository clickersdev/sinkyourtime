import React, { useState, useEffect, useRef } from "react";
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
} from "recharts";
import { gsap } from 'gsap';
import { Calendar, Clock, Target, TrendingUp } from "lucide-react";
import { sessionService } from "../services/database";
import type { TimerSession } from "../types";
import { useProjectStore } from "../stores/projectStore";
import { staggerFadeIn, fadeIn } from '../utils/animations';

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#84cc16",
];

interface AnalyticsProps {
  projectId?: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ projectId }) => {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "week"
  );
  const [isLoading, setIsLoading] = useState(true);
  const { projects } = useProjectStore();

  // GSAP refs
  const chartsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, [timeRange, projectId]);

  useEffect(() => {
    if (statsRef.current) {
      fadeIn(statsRef.current);
    }
    if (chartsRef.current) {
      fadeIn(chartsRef.current, 0.3);
    }
  }, []);

  // Animate chart data when it loads
  const animateChartData = (chartElement: HTMLElement) => {
    gsap.fromTo(chartElement,
      { scaleY: 0 },
      { scaleY: 1, duration: 0.8, ease: "power2.out" }
    );
  };

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const sessionsData = await sessionService.getByDateRange(
        startDate,
        endDate
      );
      
      // Filter by project if projectId is provided
      const filteredSessions = projectId 
        ? sessionsData.filter(s => s.projectId === projectId)
        : sessionsData;
        
      setSessions(filteredSessions);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate analytics data
  const getAnalyticsData = () => {
    const workSessions = sessions.filter((s) => s.type === "work");
    const totalFocusedTime =
      workSessions.reduce((sum, session) => sum + session.actualDuration, 0) /
      (1000 * 60); // Convert to minutes
    const completedPomodoros = workSessions.filter((s) => s.completed).length;
    const averageSessionLength =
      workSessions.length > 0 ? totalFocusedTime / workSessions.length : 0;

    // Project breakdown (only if not viewing a specific project)
    const projectBreakdown = projectId ? [] : projects
      .map((project) => {
        const projectSessions = workSessions.filter(
          (s) => s.projectId === project.id
        );
        const totalTime =
          projectSessions.reduce(
            (sum, session) => sum + session.actualDuration,
            0
          ) /
          (1000 * 60);
        return {
          name: project.name,
          time: Math.round(totalTime),
          sessions: projectSessions.length,
          color: project.color,
        };
      })
      .filter((p) => p.time > 0);

    // Category breakdown
    const categoryMap = new Map<
      string,
      { name: string; time: number; sessions: number }
    >();
    workSessions.forEach((session) => {
      const project = projects.find((p) => p.id === session.projectId);
      const category = project?.categories.find(
        (c) => c.id === session.categoryId
      );
      if (category) {
        const existing = categoryMap.get(category.id);
        const sessionTime = session.actualDuration / (1000 * 60);
        if (existing) {
          existing.time += sessionTime;
          existing.sessions += 1;
        } else {
          categoryMap.set(category.id, {
            name: category.name,
            time: sessionTime,
            sessions: 1,
          });
        }
      }
    });

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((cat) => ({ ...cat, time: Math.round(cat.time) }))
      .filter((cat) => cat.time > 0);

    // Daily breakdown
    const dailyMap = new Map<
      string,
      { date: string; time: number; sessions: number }
    >();
    workSessions.forEach((session) => {
      const date = new Date(session.startTime).toLocaleDateString();
      const existing = dailyMap.get(date);
      const sessionTime = session.actualDuration / (1000 * 60);
      if (existing) {
        existing.time += sessionTime;
        existing.sessions += 1;
      } else {
        dailyMap.set(date, {
          date,
          time: sessionTime,
          sessions: 1,
        });
      }
    });

    const dailyBreakdown = Array.from(dailyMap.values())
      .map((day) => ({ ...day, time: Math.round(day.time) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalFocusedTime: Math.round(totalFocusedTime),
      completedPomodoros,
      averageSessionLength: Math.round(averageSessionLength),
      projectBreakdown,
      categoryBreakdown,
      dailyBreakdown,
    };
  };

  const data = getAnalyticsData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {projectId ? "Project Analytics" : "Analytics"}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange("today")}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              timeRange === "today"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange("week")}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              timeRange === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              timeRange === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div 
        ref={statsRef}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Focus Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.totalFocusedTime}m
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Completed Pomodoros</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.completedPomodoros}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Avg Session Length</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.averageSessionLength}m
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter((s) => s.type === "work").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div 
        ref={chartsRef}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Project Breakdown (only show if not viewing a specific project) */}
        {!projectId && data.projectBreakdown.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Time by Project
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.projectBreakdown}
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
                  {data.projectBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} minutes`, "Time"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.categoryBreakdown.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Time by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} minutes`, "Time"]} />
                <Bar dataKey="time" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Daily Progress */}
      {data.dailyBreakdown.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Progress
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} minutes`, "Time"]} />
              <Line
                type="monotone"
                dataKey="time"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* No Data State */}
      {sessions.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No data available
          </h3>
          <p className="text-gray-500">
            {projectId 
              ? "Start your first Pomodoro session for this project to see analytics here."
              : "Start your first Pomodoro session to see your analytics here."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
