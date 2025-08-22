import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
  Play,
  CheckCircle,
  AlertCircle,
  Activity,
  Zap,
  CalendarDays,
  Timer,
  ArrowRight,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { sessionService } from "../services/database";
import { useProjectStore } from "../stores/projectStore";
import type { TimerSession } from "../types";

interface ProjectOverviewProps {
  projectId?: string;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projectId }) => {
  const { currentProject } = useProjectStore();
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "7d" | "30d" | "all"
  >("7d");

  useEffect(() => {
    if (projectId) {
      loadProjectSessions();
    }
  }, [projectId]);

  const loadProjectSessions = async () => {
    try {
      setIsLoading(true);
      const allSessions = await sessionService.getAll();
      const projectSessions = allSessions.filter(
        (s) => s.projectId === projectId
      );
      setSessions(projectSessions);
    } catch (error) {
      console.error("Error loading project sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilteredSessions = useMemo(() => {
    const workSessions = sessions.filter((s) => s.type === "work");

    if (selectedTimeframe === "all") return workSessions;

    const now = new Date();
    const daysAgo = selectedTimeframe === "7d" ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return workSessions.filter((s) => new Date(s.startTime) >= cutoffDate);
  }, [sessions, selectedTimeframe]);

  const getProjectStats = useMemo(() => {
    const workSessions = sessions.filter((s) => s.type === "work");
    const filteredSessions = getFilteredSessions;

    const totalTime =
      workSessions.reduce((sum, session) => sum + session.actualDuration, 0) /
      (1000 * 60);
    const filteredTime =
      filteredSessions.reduce(
        (sum, session) => sum + session.actualDuration,
        0
      ) /
      (1000 * 60);
    const completedSessions = workSessions.filter((s) => s.completed).length;
    const filteredCompletedSessions = filteredSessions.filter(
      (s) => s.completed
    ).length;
    const averageSessionLength =
      workSessions.length > 0 ? totalTime / workSessions.length : 0;
    const filteredAverageSessionLength =
      filteredSessions.length > 0 ? filteredTime / filteredSessions.length : 0;

    // Calculate productivity score (0-100)
    const completionRate =
      workSessions.length > 0
        ? (completedSessions / workSessions.length) * 100
        : 0;
    const avgSessionScore =
      averageSessionLength >= 25 ? 100 : (averageSessionLength / 25) * 100;
    const productivityScore = Math.round(
      (completionRate + avgSessionScore) / 2
    );

    // Get daily breakdown for the selected timeframe
    const dailyBreakdown = new Map<
      string,
      { time: number; sessions: number }
    >();
    filteredSessions.forEach((session) => {
      const date = new Date(session.startTime).toLocaleDateString();
      const duration = session.actualDuration / (1000 * 60);
      const existing = dailyBreakdown.get(date) || { time: 0, sessions: 0 };
      dailyBreakdown.set(date, {
        time: existing.time + duration,
        sessions: existing.sessions + 1,
      });
    });

    return {
      totalTime: Math.round(totalTime),
      filteredTime: Math.round(filteredTime),
      totalSessions: workSessions.length,
      filteredSessions: filteredSessions.length,
      completedSessions,
      filteredCompletedSessions,
      averageSessionLength: Math.round(averageSessionLength),
      filteredAverageSessionLength: Math.round(filteredAverageSessionLength),
      productivityScore,
      completionRate: Math.round(completionRate),
      dailyBreakdown: Array.from(dailyBreakdown.entries()).map(
        ([date, data]) => ({
          date,
          ...data,
        })
      ),
    };
  }, [sessions, getFilteredSessions]);

  const getRecentSessions = useMemo(() => {
    return sessions
      .filter((s) => s.type === "work")
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
      .slice(0, 5);
  }, [sessions]);

  const getCategoryBreakdown = useMemo(() => {
    const categoryMap = new Map<
      string,
      { name: string; time: number; sessions: number }
    >();

    getFilteredSessions.forEach((session) => {
      const category = currentProject?.categories.find(
        (c) => c.id === session.categoryId
      );
      const categoryName = category?.name || "Unknown";
      const duration = session.actualDuration / (1000 * 60);

      const existing = categoryMap.get(categoryName) || {
        name: categoryName,
        time: 0,
        sessions: 0,
      };
      categoryMap.set(categoryName, {
        name: categoryName,
        time: existing.time + duration,
        sessions: existing.sessions + 1,
      });
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);
  }, [getFilteredSessions, currentProject]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Project Not Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            The requested project could not be found.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = getProjectStats;
  const recentSessions = getRecentSessions;
  const categoryBreakdown = getCategoryBreakdown;

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-800/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-6 lg:mb-0">
            <div
              className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center"
              style={{ backgroundColor: currentProject.color }}
            >
              <span className="text-2xl font-bold text-white">
                {currentProject.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {currentProject.name}
              </h1>
              {currentProject.description && (
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {currentProject.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              to={`/project/${projectId}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Timer
            </Link>
            <Link
              to={`/project/${projectId}/analytics`}
              className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-gray-600 transition-colors duration-200"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Project Overview
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: "7d" as const, label: "7 Days" },
            { key: "30d" as const, label: "30 Days" },
            { key: "all" as const, label: "All Time" },
          ].map((timeframe) => (
            <button
              key={timeframe.key}
              onClick={() => setSelectedTimeframe(timeframe.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                selectedTimeframe === timeframe.key
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Time
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatTime(
                  selectedTimeframe === "all"
                    ? stats.totalTime
                    : stats.filteredTime
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Activity className="w-4 h-4 mr-1" />
              <span>
                {selectedTimeframe === "all"
                  ? stats.totalSessions
                  : stats.filteredSessions}{" "}
                sessions
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Completion Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.completionRate}%
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>{stats.completedSessions} completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Avg Session
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedTimeframe === "all"
                  ? stats.averageSessionLength
                  : stats.filteredAverageSessionLength}
                m
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Zap className="w-4 h-4 mr-1" />
              <span>Productivity: {stats.productivityScore}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <CalendarDays className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Daily Average
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.dailyBreakdown.length > 0
                  ? formatTime(
                      Math.round(
                        stats.filteredTime /
                          Math.min(stats.dailyBreakdown.length, 7)
                      )
                    )
                  : "0m"}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{stats.dailyBreakdown.length} active days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sessions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Recent Sessions
              </h3>
              <Link
                to={`/project/${projectId}/analytics`}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {recentSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No sessions yet
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start your first timer session to see your activity here and
                  track your progress
                </p>
                <Link
                  to={`/project/${projectId}`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors duration-200"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Your First Session
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((session) => {
                  const duration = Math.round(
                    session.actualDuration / (1000 * 60)
                  );
                  const category = currentProject.categories.find(
                    (c) => c.id === session.categoryId
                  );

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            session.completed ? "bg-green-500" : "bg-yellow-500"
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {category ? category.name : "Unknown Category"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDateTime(session.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatTime(duration)}
                        </p>
                        <p
                          className={`text-sm ${
                            session.completed
                              ? "text-green-600 dark:text-green-400"
                              : "text-yellow-600 dark:text-yellow-400"
                          }`}
                        >
                          {session.completed ? "Completed" : "Incomplete"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Category Breakdown
            </h3>
            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No category data available
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            currentProject.categories.find(
                              (c) => c.name === category.name
                            )?.color || "#6B7280",
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-24">
                        {category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatTime(Math.round(category.time))}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {category.sessions} sessions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Productivity Score
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${stats.productivityScore}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-8">
                    {stats.productivityScore}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Completion Rate
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {stats.completionRate}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active Days
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {stats.dailyBreakdown.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Daily Time
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {stats.dailyBreakdown.length > 0
                    ? formatTime(
                        Math.round(
                          stats.filteredTime /
                            Math.min(stats.dailyBreakdown.length, 7)
                        )
                      )
                    : "0m"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to={`/project/${projectId}`}
                className="flex items-center justify-between w-full p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center space-x-3">
                  <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Start New Session
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </Link>

              <Link
                to={`/project/${projectId}/analytics`}
                className="flex items-center justify-between w-full p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    View Analytics
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
