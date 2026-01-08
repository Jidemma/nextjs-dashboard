/**
 * Test Overview Analytics for All Time Periods
 * =============================================
 * Comprehensive test script to verify all metrics work correctly for each time period
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

/**
 * Calculate date ranges for different periods
 */
function getDateRanges() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const ranges = {
    today: {
      name: 'Today',
      start: new Date(now),
      end: end,
    },
    week: {
      name: 'Last Week',
      start: new Date(now),
      end: end,
    },
    month: {
      name: 'Last Month',
      start: new Date(now),
      end: end,
    },
    year: {
      name: 'Last Year',
      start: new Date(now),
      end: end,
    },
    all: {
      name: 'All Time',
      start: null,
      end: null,
    },
    custom: {
      name: 'Custom (Last 14 days)',
      start: new Date(now),
      end: end,
    },
  };

  // Today: start of today
  ranges.today.start.setHours(0, 0, 0, 0);

  // Last Week: 7 days ago (including today)
  ranges.week.start.setDate(now.getDate() - 6);
  ranges.week.start.setHours(0, 0, 0, 0);

  // Last Month: 30 days ago (including today)
  ranges.month.start.setDate(now.getDate() - 29);
  ranges.month.start.setHours(0, 0, 0, 0);

  // Last Year: 365 days ago (including today)
  ranges.year.start.setDate(now.getDate() - 364);
  ranges.year.start.setHours(0, 0, 0, 0);

  // Custom: 14 days ago
  ranges.custom.start.setDate(now.getDate() - 13);
  ranges.custom.start.setHours(0, 0, 0, 0);

  return ranges;
}

/**
 * Fetch overview analytics for a given time period
 */
async function fetchOverviewAnalytics(startDate, endDate, periodName) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const url = `${API_BASE_URL}/api/analytics/overview?${params}`;
    logInfo(`Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch analytics for ${periodName}: ${error.message}`);
  }
}

/**
 * Validate the structure of analytics data
 */
function validateAnalyticsStructure(data, periodName) {
  const errors = [];
  const warnings = [];

  if (!data || !data.success) {
    errors.push('Response missing success flag or success is false');
    return { valid: false, errors, warnings };
  }

  if (!data.data) {
    errors.push('Response missing data object');
    return { valid: false, errors, warnings };
  }

  const analytics = data.data;

  // Required top-level fields
  const requiredFields = [
    'generated_at',
    'time_period',
    'platform_health',
    'total_metrics',
    'growth_metrics',
    'engagement_metrics',
    'time_series',
  ];

  for (const field of requiredFields) {
    if (!(field in analytics)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate platform_health
  if (analytics.platform_health) {
    const healthFields = ['status', 'uptime_percentage', 'last_update'];
    for (const field of healthFields) {
      if (!(field in analytics.platform_health)) {
        errors.push(`Missing platform_health.${field}`);
      }
    }
    if (analytics.platform_health.status !== 'healthy') {
      warnings.push(`Platform status is not 'healthy': ${analytics.platform_health.status}`);
    }
  }

  // Validate total_metrics
  if (analytics.total_metrics) {
    const metricFields = [
      'total_users',
      'active_users',
      'total_journeys',
      'active_journeys',
      'total_comments',
      'total_friendships',
    ];
    for (const field of metricFields) {
      if (!(field in analytics.total_metrics)) {
        errors.push(`Missing total_metrics.${field}`);
      } else if (typeof analytics.total_metrics[field] !== 'number') {
        errors.push(`total_metrics.${field} is not a number`);
      } else if (analytics.total_metrics[field] < 0) {
        warnings.push(`total_metrics.${field} is negative: ${analytics.total_metrics[field]}`);
      }
    }
  }

  // Validate growth_metrics
  if (analytics.growth_metrics) {
    const growthFields = [
      'user_growth_rate',
      'journey_growth_rate',
      'engagement_growth_rate',
    ];
    for (const field of growthFields) {
      if (!(field in analytics.growth_metrics)) {
        errors.push(`Missing growth_metrics.${field}`);
      } else if (typeof analytics.growth_metrics[field] !== 'number') {
        errors.push(`growth_metrics.${field} is not a number`);
      }
    }
  }

  // Validate engagement_metrics
  if (analytics.engagement_metrics) {
    const engagementFields = [
      'avg_comments_per_journey',
      'avg_friends_per_user',
      'engagement_rate',
    ];
    for (const field of engagementFields) {
      if (!(field in analytics.engagement_metrics)) {
        errors.push(`Missing engagement_metrics.${field}`);
      } else if (typeof analytics.engagement_metrics[field] !== 'number') {
        errors.push(`engagement_metrics.${field} is not a number`);
      } else if (field !== 'engagement_rate' && analytics.engagement_metrics[field] < 0) {
        warnings.push(`engagement_metrics.${field} is negative: ${analytics.engagement_metrics[field]}`);
      }
    }
  }

  // Validate time_series
  if (analytics.time_series) {
    const timeSeriesFields = ['daily_users', 'daily_journeys', 'daily_engagement'];
    for (const field of timeSeriesFields) {
      if (!(field in analytics.time_series)) {
        errors.push(`Missing time_series.${field}`);
      } else if (!Array.isArray(analytics.time_series[field])) {
        errors.push(`time_series.${field} is not an array`);
      } else {
        // Validate time series items
        analytics.time_series[field].forEach((item, index) => {
          if (!item.date) {
            errors.push(`time_series.${field}[${index}] missing date`);
          }
          if (typeof item.value !== 'number') {
            errors.push(`time_series.${field}[${index}].value is not a number`);
          }
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Display metrics in a readable format
 */
function displayMetrics(analytics, periodName) {
  logSection(`Metrics for ${periodName}`);
  
  const { total_metrics, growth_metrics, engagement_metrics, time_series } = analytics;

  console.log('\n📊 Total Metrics:');
  console.log(`   Total Users: ${total_metrics.total_users}`);
  console.log(`   Active Users: ${total_metrics.active_users}`);
  console.log(`   Total Journeys: ${total_metrics.total_journeys}`);
  console.log(`   Active Journeys: ${total_metrics.active_journeys}`);
  console.log(`   Total Comments: ${total_metrics.total_comments}`);
  console.log(`   Total Friendships: ${total_metrics.total_friendships}`);

  console.log('\n📈 Growth Metrics:');
  console.log(`   User Growth Rate: ${growth_metrics.user_growth_rate >= 0 ? '+' : ''}${growth_metrics.user_growth_rate.toFixed(1)}%`);
  console.log(`   Journey Growth Rate: ${growth_metrics.journey_growth_rate >= 0 ? '+' : ''}${growth_metrics.journey_growth_rate.toFixed(1)}%`);
  console.log(`   Engagement Growth Rate: ${growth_metrics.engagement_growth_rate >= 0 ? '+' : ''}${growth_metrics.engagement_growth_rate.toFixed(1)}%`);

  console.log('\n💬 Engagement Metrics:');
  console.log(`   Avg Comments/Journey: ${engagement_metrics.avg_comments_per_journey.toFixed(2)}`);
  console.log(`   Avg Friends/User: ${engagement_metrics.avg_friends_per_user.toFixed(2)}`);
  console.log(`   Engagement Rate: ${engagement_metrics.engagement_rate.toFixed(1)}%`);

  console.log('\n📅 Time Series Data:');
  console.log(`   Daily Users: ${time_series.daily_users.length} data points`);
  console.log(`   Daily Journeys: ${time_series.daily_journeys.length} data points`);
  console.log(`   Daily Engagement: ${time_series.daily_engagement.length} data points`);
}

/**
 * Test a specific time period
 */
async function testPeriod(periodKey, range) {
  logSection(`Testing: ${range.name}`);

  try {
    const data = await fetchOverviewAnalytics(range.start, range.end, range.name);
    const validation = validateAnalyticsStructure(data, range.name);

    if (!validation.valid) {
      logError(`Validation failed for ${range.name}`);
      validation.errors.forEach(error => logError(`  - ${error}`));
      return { success: false, data, validation };
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => logWarning(`  - ${warning}`));
    }

    logSuccess(`${range.name} - Structure is valid`);
    displayMetrics(data.data, range.name);

    return { success: true, data, validation };
  } catch (error) {
    logError(`Failed to test ${range.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Compare metrics across periods
 */
function comparePeriods(results) {
  logSection('Cross-Period Comparison');

  const successfulResults = results.filter(r => r.success && r.data);
  
  if (successfulResults.length < 2) {
    logWarning('Not enough successful results to compare');
    return;
  }

  console.log('\nTotal Users across periods:');
  successfulResults.forEach(result => {
    const periodName = result.periodName;
    const totalUsers = result.data.data.total_metrics.total_users;
    console.log(`   ${periodName}: ${totalUsers}`);
  });

  console.log('\nActive Users across periods:');
  successfulResults.forEach(result => {
    const periodName = result.periodName;
    const activeUsers = result.data.data.total_metrics.active_users;
    console.log(`   ${periodName}: ${activeUsers}`);
  });

  // Check if metrics make sense (e.g., "All Time" should have >= metrics than shorter periods)
  const allTimeResult = successfulResults.find(r => r.periodName === 'All Time');
  if (allTimeResult) {
    const allTimeUsers = allTimeResult.data.data.total_metrics.total_users;
    const allTimeJourneys = allTimeResult.data.data.total_metrics.total_journeys;
    const allTimeComments = allTimeResult.data.data.total_metrics.total_comments;

    successfulResults.forEach(result => {
      if (result.periodName !== 'All Time') {
        const periodUsers = result.data.data.total_metrics.total_users;
        const periodJourneys = result.data.data.total_metrics.total_journeys;
        const periodComments = result.data.data.total_metrics.total_comments;

        // Note: For filtered periods, these might be less than all-time, which is expected
        // But total_users should always be the same (it's not filtered by date)
        if (result.periodName !== 'All Time' && periodUsers > allTimeUsers) {
          logWarning(`${result.periodName} has more total users than All Time (this might be expected if total_users is not date-filtered)`);
        }
      }
    });
  }
}

/**
 * Main test function
 */
async function runTests() {
  logSection('Overview Analytics Time Period Tests');
  logInfo(`Testing API at: ${API_BASE_URL}`);
  logInfo(`Started at: ${new Date().toISOString()}\n`);

  const ranges = getDateRanges();
  const results = [];

  // Test each period
  for (const [key, range] of Object.entries(ranges)) {
    const result = await testPeriod(key, range);
    result.periodName = range.name;
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  logSection('Test Summary');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nTotal Periods Tested: ${results.length}`);
  logSuccess(`Successful: ${successful}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }

  // List failed tests
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.success).forEach(result => {
      logError(`  - ${result.periodName}`);
      if (result.error) {
        logError(`    Error: ${result.error}`);
      }
      if (result.validation && result.validation.errors.length > 0) {
        result.validation.errors.forEach(error => {
          logError(`    ${error}`);
        });
      }
    });
  }

  // Compare periods
  comparePeriods(results);

  logSection('Tests Complete');
  logInfo(`Completed at: ${new Date().toISOString()}\n`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

