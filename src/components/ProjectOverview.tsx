import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Calendar, Target, TrendingUp, BarChart3, Play } from "lucide-react";
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

  useEffect(() => {
    if (projectId) {
      loadProjectSessions();
    }
  }, [projectId]);

  const loadProjectSessions = async () => {
    try {
      const allSessions = await sessionService.getAll();
      const projectSessions = allSessions.filter(s => s.projectId === projectId);
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
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProjectStats = () => {
    const workSessions = sessions.filter(s => s.type === 'work');
    const totalTime = workSessions.reduce((sum, session) => sum + session.actualDuration, 0) / (1000 * 60);
    const completedSessions = workSessions.filter(s => s.completed).length;
    const averageSessionLength = workSessions.length > 0 ? totalTime / workSessions.length : 0;
    
    // Get last 7 days sessions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = workSessions.filter(s => new Date(s.startTime) >= sevenDaysAgo);
    const recentTime = recentSessions.reduce((sum, session) => sum + session.actualDuration, 0) / (1000 * 60);

    return {
      totalTime: Math.round(totalTime),
      totalSessions: workSessions.length,
      completedSessions,
      averageSessionLength: Math.round(averageSessionLength),
      recentTime: Math.round(recentTime),
      recentSessions: recentSessions.length,
    };
  };

  const getRecentSessions = () => {
    return sessions
      .filter(s => s.type === 'work')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Project not found</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = getProjectStats();
  const recentSessions = getRecentSessions();

  return (
    <div>
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-12 h-12 rounded-full"
            style={{ backgroundColor: currentProject.color }}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
            {currentProject.description && (
              <p className="text-gray-600 mt-1">{currentProject.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Link
            to={`/project/${projectId}`}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Play size={16} />
            <span>Start Timer</span>
          </Link>
          <Link
            to={`/project/${projectId}/analytics`}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <BarChart3 size={16} />
            <span>View Analytics</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(stats.totalTime)}
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
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSessions}
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
              <p className="text-sm text-gray-500">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageSessionLength}m
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
              <p className="text-sm text-gray-500">Last 7 Days</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(stats.recentTime)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Sessions</h2>
          <Link
            to={`/project/${projectId}/analytics`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-500 mb-4">
              Start your first timer session to see your activity here
            </p>
            <Link
              to={`/project/${projectId}`}
              className="btn btn-primary"
            >
              Start Your First Session
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentSessions.map((session) => {
              const duration = Math.round(session.actualDuration / (1000 * 60));
              const category = currentProject.categories.find(c => c.id === session.categoryId);
              
              return (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {category ? category.name : 'Unknown Category'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(session.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatTime(duration)}</p>
                    <p className="text-sm text-gray-500">
                      {session.completed ? 'Completed' : 'Incomplete'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Completion Rate</h3>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalSessions > 0 
                ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-500">
              {stats.completedSessions} of {stats.totalSessions} sessions completed
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Activity</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Sessions</span>
              <span className="font-medium">{stats.recentSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time Spent</span>
              <span className="font-medium">{formatTime(stats.recentTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Average</span>
              <span className="font-medium">
                {stats.recentSessions > 0 
                  ? formatTime(Math.round(stats.recentTime / 7))
                  : '0m'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
