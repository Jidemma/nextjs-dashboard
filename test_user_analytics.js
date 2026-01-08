/**
 * Test User Analytics for All Time Periods
 * =========================================
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
 * Fetch user analytics for a given time period
 */
async function fetchUserAnalytics(startDate, endDate, periodName) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    params.append('limit', '10'); // Limit for most active users

    const url = `${API_BASE_URL}/api/analytics/users?${params}`;
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
 * Validate the structure of user analytics data
 */
function validateUserAnalyticsStructure(data, periodName) {
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
    'user_demographics',
    'user_activity',
    'user_retention',
  ];

  for (const field of requiredFields) {
    if (!(field in analytics)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate user_demographics
  if (analytics.user_demographics) {
    const demoFields = ['total_users', 'active_users', 'new_users'];
    for (const field of demoFields) {
      if (!(field in analytics.user_demographics)) {
        errors.push(`Missing user_demographics.${field}`);
      } else if (typeof analytics.user_demographics[field] !== 'number') {
        errors.push(`user_demographics.${field} is not a number`);
      } else if (analytics.user_demographics[field] < 0) {
        warnings.push(`user_demographics.${field} is negative: ${analytics.user_demographics[field]}`);
      }
    }
    
    // Gender distribution is optional but should be an object if present
    if (analytics.user_demographics.gender_distribution && 
        typeof analytics.user_demographics.gender_distribution !== 'object') {
      errors.push('user_demographics.gender_distribution is not an object');
    }
  }

  // Validate user_activity
  if (analytics.user_activity) {
    const activityFields = [
      'avg_journeys_per_user',
      'avg_comments_per_user',
      'avg_friends_per_user',
      'most_active_users',
    ];
    for (const field of activityFields) {
      if (!(field in analytics.user_activity)) {
        errors.push(`Missing user_activity.${field}`);
      } else if (field !== 'most_active_users') {
        if (typeof analytics.user_activity[field] !== 'number') {
          errors.push(`user_activity.${field} is not a number`);
        } else if (analytics.user_activity[field] < 0) {
          warnings.push(`user_activity.${field} is negative: ${analytics.user_activity[field]}`);
        }
      } else {
        // most_active_users should be an array
        if (!Array.isArray(analytics.user_activity[field])) {
          errors.push('user_activity.most_active_users is not an array');
        } else {
          // Validate each user object
          analytics.user_activity[field].forEach((user, index) => {
            if (!user.user_id && !user._id) {
              warnings.push(`user_activity.most_active_users[${index}] missing user_id`);
            }
            if (typeof user.activity_score !== 'number') {
              warnings.push(`user_activity.most_active_users[${index}] missing or invalid activity_score`);
            }
          });
        }
      }
    }
  }

  // Validate user_retention
  if (analytics.user_retention) {
    const retentionFields = ['retention_rate', 'churn_rate', 'returning_users'];
    for (const field of retentionFields) {
      if (!(field in analytics.user_retention)) {
        errors.push(`Missing user_retention.${field}`);
      } else if (typeof analytics.user_retention[field] !== 'number') {
        errors.push(`user_retention.${field} is not a number`);
      } else {
        // Validate ranges
        if (field === 'retention_rate' || field === 'churn_rate') {
          if (analytics.user_retention[field] < 0 || analytics.user_retention[field] > 100) {
            warnings.push(`user_retention.${field} is outside 0-100 range: ${analytics.user_retention[field]}`);
          }
        } else if (analytics.user_retention[field] < 0) {
          warnings.push(`user_retention.${field} is negative: ${analytics.user_retention[field]}`);
        }
      }
    }
  }

  // Validate registration_trends (optional)
  if (analytics.registration_trends !== undefined) {
    if (!Array.isArray(analytics.registration_trends)) {
      errors.push('registration_trends is not an array');
    } else {
      analytics.registration_trends.forEach((trend, index) => {
        if (!trend.month) {
          errors.push(`registration_trends[${index}] missing month`);
        }
        if (typeof trend.count !== 'number') {
          errors.push(`registration_trends[${index}].count is not a number`);
        }
      });
    }
  }

  // Validate activity_distribution (optional)
  if (analytics.activity_distribution !== undefined) {
    if (!Array.isArray(analytics.activity_distribution)) {
      errors.push('activity_distribution is not an array');
    } else {
      analytics.activity_distribution.forEach((item, index) => {
        if (!item.range) {
          errors.push(`activity_distribution[${index}] missing range`);
        }
        if (typeof item.count !== 'number') {
          errors.push(`activity_distribution[${index}].count is not a number`);
        } else if (item.count < 0) {
          warnings.push(`activity_distribution[${index}].count is negative: ${item.count}`);
        }
      });
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
  
  const { user_demographics, user_activity, user_retention, registration_trends, activity_distribution } = analytics;

  console.log('\n👥 User Demographics:');
  console.log(`   Total Users: ${user_demographics.total_users}`);
  console.log(`   Active Users: ${user_demographics.active_users}`);
  console.log(`   New Users: ${user_demographics.new_users}`);
  if (user_demographics.gender_distribution && Object.keys(user_demographics.gender_distribution).length > 0) {
    console.log(`   Gender Distribution:`, user_demographics.gender_distribution);
  }

  console.log('\n📊 User Activity:');
  console.log(`   Avg Journeys/User: ${user_activity.avg_journeys_per_user.toFixed(2)}`);
  console.log(`   Avg Comments/User: ${user_activity.avg_comments_per_user.toFixed(2)}`);
  console.log(`   Avg Friends/User: ${user_activity.avg_friends_per_user.toFixed(2)}`);
  console.log(`   Most Active Users: ${user_activity.most_active_users.length} users`);
  if (user_activity.most_active_users.length > 0) {
    const topUser = user_activity.most_active_users[0];
    console.log(`   Top User: ${topUser.username || topUser.name || topUser.user_id} (Score: ${topUser.activity_score?.toFixed(1) || 'N/A'})`);
  }

  console.log('\n🔄 User Retention:');
  console.log(`   Retention Rate: ${user_retention.retention_rate.toFixed(1)}%`);
  console.log(`   Churn Rate: ${user_retention.churn_rate.toFixed(1)}%`);
  console.log(`   Returning Users: ${user_retention.returning_users}`);

  if (registration_trends && registration_trends.length > 0) {
    console.log('\n📈 Registration Trends:');
    console.log(`   Data Points: ${registration_trends.length}`);
    registration_trends.slice(0, 5).forEach(trend => {
      console.log(`   ${trend.month}: ${trend.count} users`);
    });
    if (registration_trends.length > 5) {
      console.log(`   ... and ${registration_trends.length - 5} more`);
    }
  }

  if (activity_distribution && activity_distribution.length > 0) {
    console.log('\n📊 Activity Distribution:');
    activity_distribution.forEach(dist => {
      console.log(`   ${dist.range}: ${dist.count} users`);
    });
  }
}

/**
 * Test a specific time period
 */
async function testPeriod(periodKey, range) {
  logSection(`Testing: ${range.name}`);

  try {
    const data = await fetchUserAnalytics(range.start, range.end, range.name);
    const validation = validateUserAnalyticsStructure(data, range.name);

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
    const totalUsers = result.data.data.user_demographics.total_users;
    console.log(`   ${periodName}: ${totalUsers}`);
  });

  console.log('\nActive Users across periods:');
  successfulResults.forEach(result => {
    const periodName = result.periodName;
    const activeUsers = result.data.data.user_demographics.active_users;
    console.log(`   ${periodName}: ${activeUsers}`);
  });

  console.log('\nNew Users across periods:');
  successfulResults.forEach(result => {
    const periodName = result.periodName;
    const newUsers = result.data.data.user_demographics.new_users;
    console.log(`   ${periodName}: ${newUsers}`);
  });

  console.log('\nRetention Rate across periods:');
  successfulResults.forEach(result => {
    const periodName = result.periodName;
    const retentionRate = result.data.data.user_retention.retention_rate;
    console.log(`   ${periodName}: ${retentionRate.toFixed(1)}%`);
  });

  // Check consistency
  const allTimeResult = successfulResults.find(r => r.periodName === 'All Time');
  if (allTimeResult) {
    const allTimeUsers = allTimeResult.data.data.user_demographics.total_users;
    
    successfulResults.forEach(result => {
      if (result.periodName !== 'All Time') {
        const periodUsers = result.data.data.user_demographics.total_users;
        
        // Total users should be consistent (not date-filtered)
        if (periodUsers !== allTimeUsers) {
          logWarning(`${result.periodName} has different total users than All Time (${periodUsers} vs ${allTimeUsers})`);
        }
      }
    });
  }
}

/**
 * Main test function
 */
async function runTests() {
  logSection('User Analytics Time Period Tests');
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

