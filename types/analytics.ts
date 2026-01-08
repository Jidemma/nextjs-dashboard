/**
 * TypeScript Type Definitions for Analytics Data
 * ==============================================
 */

// Base types
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface MetricCard {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percentage' | 'currency';
  icon?: string;
}

// Overview Analytics Types
export interface OverviewAnalytics {
  generated_at: string;
  time_period: {
    start_date: string;
    end_date: string;
    description: string;
  };
  platform_health: {
    status: string;
    uptime_percentage: number;
    last_update: string;
  };
  total_metrics: {
    total_users: number;
    active_users: number;
    total_journeys: number;
    active_journeys: number;
    total_comments: number;
    total_friendships: number;
  };
  growth_metrics: {
    user_growth_rate: number;
    journey_growth_rate: number;
    engagement_growth_rate: number;
  };
  engagement_metrics: {
    avg_comments_per_journey: number;
    avg_friends_per_user: number;
    engagement_rate: number;
  };
  time_series?: {
    daily_users: TimeSeriesDataPoint[];
    daily_journeys: TimeSeriesDataPoint[];
    daily_engagement: TimeSeriesDataPoint[];
  };
}

// User Analytics Types
export interface UserAnalytics {
  generated_at: string;
  time_period: {
    start_date: string;
    end_date: string;
  };
  user_demographics: {
    total_users: number;
    active_users: number;
    new_users: number;
    gender_distribution?: {
      [key: string]: number;
    };
    age_distribution?: {
      [key: string]: number;
    };
  };
  user_activity: {
    avg_journeys_per_user: number;
    avg_comments_per_user: number;
    avg_friends_per_user: number;
    most_active_users: Array<{
      user_id: string;
      username?: string;
      activity_score: number;
    }>;
  };
  user_retention: {
    retention_rate: number;
    churn_rate: number;
    returning_users: number;
  };
  registration_trends?: Array<{
    month: string;
    count: number;
  }>;
  activity_distribution?: Array<{
    range: string;
    count: number;
  }>;
}

// Journey Analytics Types
export interface JourneyAnalytics {
  generated_at: string;
  time_period: {
    start_date: string;
    end_date: string;
  };
  journey_overview: {
    total_journeys: number;
    active_journeys: number;
    completed_journeys: number;
    avg_journey_duration: number;
    avg_participants_per_journey: number;
    status_distribution?: {
      [key: string]: number;
    };
  };
  journey_engagement: {
    total_comments: number;
    avg_comments_per_journey: number;
    most_commented_journeys: Array<{
      journey_id: string;
      title?: string;
      comments: number;
    }>;
  };
  journey_types?: {
    [key: string]: number;
  };
  popular_destinations?: Array<{
    destination: string;
    count: number;
  }>;
  journey_trends?: Array<{
    month: string;
    count: number;
  }>;
  duration_distribution?: Array<{
    range: string;
    count: number;
  }>;
  top_journey_creators?: Array<{
    user_id: string;
    display_name: string;
    journey_count: number;
  }>;
}

// Geographic Analytics Types
export interface GeographicAnalytics {
  generated_at: string;
  time_period: {
    start_date: string;
    end_date: string;
  };
  geographic_distribution: {
    countries: Array<{
      country: string;
      user_count: number;
      journey_count: number;
    }>;
    cities: Array<{
      city: string;
      country: string;
      user_count: number;
      journey_count: number;
    }>;
  };
  popular_destinations: Array<{
    destination: string;
    visits: number;
    unique_users: number;
  }>;
  travel_patterns: {
    avg_distance_traveled?: number;
    most_common_routes?: Array<{
      from: string;
      to: string;
      count: number;
    }>;
  };
}

// Social Network Analytics Types
export interface SocialNetworkAnalytics {
  generated_at: string;
  time_period: {
    start_date: string;
    end_date: string;
  };
  network_overview: {
    total_friendships: number;
    new_friendships: number;
    avg_friends_per_user: number;
    network_density: number;
  };
  social_activity: {
    total_friend_requests: number;
    accepted_requests: number;
    pending_requests: number;
    acceptance_rate: number;
  };
  influential_users: Array<{
    user_id: string;
    username?: string;
    name?: string;
    friend_count: number;
    influence_score: number;
  }>;
  network_graph?: {
    nodes: Array<{
      id: string;
      name: string;
      connections: number;
      group: number;
    }>;
    links: Array<{
      source: string;
      target: string;
    }>;
  };
  community_clusters?: Array<{
    cluster_id: string;
    size: number;
    avg_connections: number;
  }>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

// Filter and Query Types
export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
  collections?: string[];
}

export interface CollectionInfo {
  name: string;
  count: number;
  size: number;
  avgObjSize: number;
  lastUpdated?: string;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

// Dashboard State Types
export interface DashboardState {
  selectedAnalytic: string;
  dateRange: DateRange;
  refreshInterval: number;
  autoRefresh: boolean;
}

// Export types
export interface ExportOptions {
  format: 'json' | 'csv' | 'excel';
  includeCharts: boolean;
  dateRange?: DateRange;
}

