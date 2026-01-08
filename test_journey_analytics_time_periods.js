/**
 * Journey Analytics Time Period Test
 * ==================================
 * Tests Journey Analytics API for all time periods to ensure data accuracy
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getTimePeriodDates(period) {
  const now = new Date();
  const utcNow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));

  switch (period) {
    case 'today':
      const todayStart = new Date(utcNow);
      todayStart.setUTCHours(6, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
      todayEnd.setUTCHours(5, 59, 59, 999);
      return {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString()
      };

    case 'last_week':
      const weekStart = new Date(utcNow);
      weekStart.setUTCDate(weekStart.getUTCDate() - 7);
      weekStart.setUTCHours(6, 0, 0, 0);
      const weekEnd = new Date(utcNow);
      weekEnd.setUTCHours(5, 59, 59, 999);
      return {
        start: weekStart.toISOString(),
        end: weekEnd.toISOString()
      };

    case 'last_month':
      const monthStart = new Date(utcNow);
      monthStart.setUTCDate(monthStart.getUTCDate() - 30);
      monthStart.setUTCHours(6, 0, 0, 0);
      const monthEnd = new Date(utcNow);
      monthEnd.setUTCHours(5, 59, 59, 999);
      return {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString()
      };

    case 'last_year':
      const yearStart = new Date(utcNow);
      yearStart.setUTCFullYear(yearStart.getUTCFullYear() - 1);
      yearStart.setUTCHours(6, 0, 0, 0);
      const yearEnd = new Date(utcNow);
      yearEnd.setUTCHours(5, 59, 59, 999);
      return {
        start: yearStart.toISOString(),
        end: yearEnd.toISOString()
      };

    case 'custom':
      const customStart = new Date(utcNow);
      customStart.setUTCDate(customStart.getUTCDate() - 14);
      customStart.setUTCHours(6, 0, 0, 0);
      const customEnd = new Date(utcNow);
      customEnd.setUTCHours(5, 59, 59, 999);
      return {
        start: customStart.toISOString(),
        end: customEnd.toISOString()
      };

    default:
      return { start: null, end: null };
  }
}

async function testJourneyAnalytics(periodName, dates) {
  try {
    const params = new URLSearchParams();
    if (dates.start) params.append('startDate', dates.start);
    if (dates.end) params.append('endDate', dates.end);
    params.append('limit', '10');

    const url = `${API_BASE_URL}/api/analytics/journeys?${params}`;
    log(`ℹ Fetching: ${url}`, 'blue');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.success) {
      throw new Error('Response success flag is false');
    }

    if (!data.data) {
      throw new Error('Missing data field in response');
    }

    const analytics = data.data;

    // Required fields validation
    const requiredFields = [
      'journey_overview',
      'journey_engagement',
      'popular_destinations',
      'journey_trends',
      'duration_distribution',
      'top_journey_creators' // New field
    ];

    for (const field of requiredFields) {
      if (!(field in analytics)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate journey_overview structure
    const overview = analytics.journey_overview;
    if (typeof overview.total_journeys !== 'number') {
      throw new Error('total_journeys must be a number');
    }
    if (typeof overview.active_journeys !== 'number') {
      throw new Error('active_journeys must be a number');
    }
    if (typeof overview.completed_journeys !== 'number') {
      throw new Error('completed_journeys must be a number');
    }

    // Validate journey_engagement structure
    const engagement = analytics.journey_engagement;
    if (!Array.isArray(engagement.most_commented_journeys)) {
      throw new Error('most_commented_journeys must be an array');
    }

    // Validate top_journey_creators structure (new field)
    const creators = analytics.top_journey_creators;
    if (!Array.isArray(creators)) {
      throw new Error('top_journey_creators must be an array');
    }

    // Validate creator objects
    for (const creator of creators) {
      if (!creator || typeof creator !== 'object') {
        throw new Error('Invalid creator object: not an object');
      }
      if (!creator.user_id || creator.user_id === '' || creator.user_id === 'null' || creator.user_id === 'None') {
        throw new Error(`Invalid creator object: missing or invalid user_id. Creator: ${JSON.stringify(creator)}`);
      }
      if (!creator.display_name || creator.display_name.trim() === '') {
        throw new Error(`Invalid creator object: missing or empty display_name. Creator: ${JSON.stringify(creator)}`);
      }
      if (typeof creator.journey_count !== 'number' || creator.journey_count <= 0) {
        throw new Error(`Invalid creator object: journey_count must be a positive number. Creator: ${JSON.stringify(creator)}`);
      }
    }

    // Validate arrays
    if (!Array.isArray(analytics.popular_destinations)) {
      throw new Error('popular_destinations must be an array');
    }
    if (!Array.isArray(analytics.journey_trends)) {
      throw new Error('journey_trends must be an array');
    }
    if (!Array.isArray(analytics.duration_distribution)) {
      throw new Error('duration_distribution must be an array');
    }

    // Logical validations
    if (overview.active_journeys > overview.total_journeys) {
      log(`⚠   - active_journeys (${overview.active_journeys}) > total_journeys (${overview.total_journeys})`, 'yellow');
    }

    if (overview.completed_journeys > overview.total_journeys) {
      log(`⚠   - completed_journeys (${overview.completed_journeys}) > total_journeys (${overview.total_journeys})`, 'yellow');
    }

    // Check most_commented_journeys have titles
    const journeysWithoutTitles = engagement.most_commented_journeys.filter(
      j => !j.title || j.title.startsWith('Journey ')
    );
    if (journeysWithoutTitles.length > 0) {
      log(`ℹ   - ${journeysWithoutTitles.length} journeys using fallback titles`, 'blue');
    }

    return {
      success: true,
      data: analytics,
      periodName,
      dates
    };
  } catch (error) {
    log(`✗ ${periodName} - ERROR: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message,
      periodName,
      dates
    };
  }
}

async function runTests() {
  log('\n============================================================', 'cyan');
  log('Journey Analytics Time Period Tests', 'cyan');
  log('============================================================', 'cyan');
  log(`ℹ Testing API at: ${API_BASE_URL}`, 'blue');
  log(`ℹ Started at: ${new Date().toISOString()}`, 'blue');
  log('');

  const periods = [
    { name: 'Today', period: 'today' },
    { name: 'Last Week', period: 'last_week' },
    { name: 'Last Month', period: 'last_month' },
    { name: 'Last Year', period: 'last_year' },
    { name: 'All Time', period: 'all' },
    { name: 'Custom (Last 14 days)', period: 'custom' }
  ];

  const results = [];

  for (const { name, period } of periods) {
    log(`\n============================================================`, 'cyan');
    log(`Testing: ${name}`, 'cyan');
    log(`============================================================`, 'cyan');

    const dates = getTimePeriodDates(period);
    const result = await testJourneyAnalytics(name, dates);

    if (result.success) {
      const { data } = result;
      log(`✓ ${name} - OK`, 'green');
      log(`\nMetrics for ${name}`, 'cyan');
      log(`============================================================`, 'cyan');
      log(`Total Journeys: ${data.journey_overview.total_journeys}`);
      log(`Active Journeys: ${data.journey_overview.active_journeys}`);
      log(`Completed Journeys: ${data.journey_overview.completed_journeys}`);
      log(`Total Comments: ${data.journey_engagement.total_comments}`);
      log(`Avg Comments/Journey: ${data.journey_engagement.avg_comments_per_journey}`);
      log(`Top Creators: ${data.top_journey_creators.length}`);
      log(`Popular Destinations: ${data.popular_destinations.length}`);
      log(`Journey Trends: ${data.journey_trends.length} months`);
      log(`Duration Distributions: ${data.duration_distribution.length} buckets`);
      
      // Show top 3 creators
      if (data.top_journey_creators.length > 0) {
        log(`\nTop 3 Journey Creators:`, 'cyan');
        data.top_journey_creators.slice(0, 3).forEach((creator, idx) => {
          log(`  ${idx + 1}. ${creator.display_name}: ${creator.journey_count} journeys`);
        });
      }
    }

    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  log(`\n============================================================`, 'cyan');
  log('Test Summary', 'cyan');
  log(`============================================================`, 'cyan');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  log(`Total Periods Tested: ${results.length}`);
  log(`✓ Successful: ${successful}`, 'green');
  if (failed > 0) {
    log(`✗ Failed: ${failed}`, 'red');
  }

  // Cross-period checks
  log(`\n============================================================`, 'cyan');
  log('Cross-Period Checks (monotonic growth with bigger windows)', 'cyan');
  log(`============================================================`, 'cyan');

  const successfulResults = results.filter(r => r.success);
  
  for (let i = 0; i < successfulResults.length - 1; i++) {
    const current = successfulResults[i];
    const next = successfulResults[i + 1];
    
    if (!current || !next) continue;

    const currentJourneys = current.data.journey_overview.total_journeys;
    const nextJourneys = next.data.journey_overview.total_journeys;
    const currentComments = current.data.journey_engagement.total_comments;
    const nextComments = next.data.journey_engagement.total_comments;

    // Check if next period should have >= journeys (unless it's All Time which might use different logic)
    if (next.periodName === 'All Time' || current.periodName === 'All Time') {
      log(`ℹ Skipping monotonic check for ${current.periodName} -> ${next.periodName} (All Time may use different aggregation)`, 'blue');
    } else {
      if (nextJourneys >= currentJourneys) {
        log(`✓ Total Journeys non-decreasing: ${current.periodName} (${currentJourneys}) <= ${next.periodName} (${nextJourneys})`, 'green');
      } else {
        log(`⚠ Total Journeys decreased from ${current.periodName} (${currentJourneys}) to ${next.periodName} (${nextJourneys})`, 'yellow');
      }

      if (nextComments >= currentComments) {
        log(`✓ Total Comments non-decreasing: ${current.periodName} (${currentComments}) <= ${next.periodName} (${nextComments})`, 'green');
      } else {
        log(`⚠ Total Comments decreased from ${current.periodName} (${currentComments}) to ${next.periodName} (${nextComments})`, 'yellow');
      }
    }
  }

  log(`\n============================================================`, 'cyan');
  log('Done', 'cyan');
  log(`============================================================`, 'cyan');
  log(`ℹ Completed at: ${new Date().toISOString()}`, 'blue');
  log('');

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

