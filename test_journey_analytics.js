/**
 * Test Journey Analytics for All Time Periods
 * ==========================================
 * Validates response structure + key invariants to ensure time period filtering is accurate.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
function ok(message) {
  log(`✓ ${message}`, 'green');
}
function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}
function fail(message) {
  log(`✗ ${message}`, 'red');
}
function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function getDateRanges() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const ranges = {
    today: { name: 'Today', start: new Date(now), end },
    week: { name: 'Last Week', start: new Date(now), end },
    month: { name: 'Last Month', start: new Date(now), end },
    year: { name: 'Last Year', start: new Date(now), end },
    all: { name: 'All Time', start: null, end: null },
    custom: { name: 'Custom (Last 14 days)', start: new Date(now), end },
  };

  ranges.today.start.setHours(0, 0, 0, 0);

  ranges.week.start.setDate(now.getDate() - 6);
  ranges.week.start.setHours(0, 0, 0, 0);

  ranges.month.start.setDate(now.getDate() - 29);
  ranges.month.start.setHours(0, 0, 0, 0);

  ranges.year.start.setDate(now.getDate() - 364);
  ranges.year.start.setHours(0, 0, 0, 0);

  ranges.custom.start.setDate(now.getDate() - 13);
  ranges.custom.start.setHours(0, 0, 0, 0);

  return ranges;
}

async function fetchJourneyAnalytics(startDate, endDate, periodName) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());
  params.append('limit', '10');

  const url = `${API_BASE_URL}/api/analytics/journeys?${params}`;
  info(`Fetching: ${url}`);

  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (!json || json.success !== true) throw new Error(`API returned success=false for ${periodName}`);
  return json;
}

function sumObjectValues(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.values(obj).reduce((acc, v) => (typeof v === 'number' ? acc + v : acc), 0);
}

function approxEqual(a, b, eps = 0.01) {
  return Math.abs(a - b) <= eps;
}

function validateJourneyStructure(payload) {
  const errors = [];
  const warnings = [];

  if (!payload || payload.success !== true) {
    errors.push('Response missing success=true');
    return { valid: false, errors, warnings };
  }
  const a = payload.data;
  if (!a) {
    errors.push('Response missing data');
    return { valid: false, errors, warnings };
  }

  // Required
  for (const key of ['generated_at', 'time_period', 'journey_overview', 'journey_engagement']) {
    if (!(key in a)) errors.push(`Missing field: ${key}`);
  }

  // journey_overview
  const jo = a.journey_overview;
  for (const key of [
    'total_journeys',
    'active_journeys',
    'completed_journeys',
    'avg_journey_duration',
    'avg_participants_per_journey',
  ]) {
    if (jo?.[key] === undefined) errors.push(`Missing journey_overview.${key}`);
    else if (typeof jo[key] !== 'number') errors.push(`journey_overview.${key} is not a number`);
  }

  // journey_engagement
  const je = a.journey_engagement;
  for (const key of ['total_comments', 'avg_comments_per_journey', 'most_commented_journeys']) {
    if (je?.[key] === undefined) errors.push(`Missing journey_engagement.${key}`);
  }
  if (je && typeof je.total_comments !== 'number') errors.push('journey_engagement.total_comments is not a number');
  if (je && typeof je.avg_comments_per_journeys !== 'undefined') {
    // typo guard, ignore
    warnings.push('Unexpected field journey_engagement.avg_comments_per_journeys present');
  }
  if (je && typeof je.avg_comments_per_journey !== 'number') errors.push('journey_engagement.avg_comments_per_journey is not a number');
  if (je && !Array.isArray(je.most_commented_journeys)) errors.push('journey_engagement.most_commented_journeys is not an array');

  // Optional arrays
  if (a.popular_destinations !== undefined && !Array.isArray(a.popular_destinations)) {
    errors.push('popular_destinations is not an array');
  }
  if (a.journey_trends !== undefined && !Array.isArray(a.journey_trends)) {
    errors.push('journey_trends is not an array');
  }
  if (a.duration_distribution !== undefined && !Array.isArray(a.duration_distribution)) {
    errors.push('duration_distribution is not an array');
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateInvariants(analytics, periodName) {
  const errors = [];
  const warnings = [];

  const jo = analytics.journey_overview;
  const je = analytics.journey_engagement;

  // Basic non-negative checks
  for (const [label, val] of [
    ['total_journeys', jo.total_journeys],
    ['active_journeys', jo.active_journeys],
    ['completed_journeys', jo.completed_journeys],
    ['total_comments', je.total_comments],
    ['avg_journey_duration', jo.avg_journey_duration],
    ['avg_participants_per_journey', jo.avg_participants_per_journey],
    ['avg_comments_per_journey', je.avg_comments_per_journey],
  ]) {
    if (typeof val !== 'number' || Number.isNaN(val)) errors.push(`${label} is not a valid number`);
    else if (val < 0) warnings.push(`${label} is negative (${val})`);
  }

  // Active/completed should not exceed total (allow other statuses)
  if (jo.active_journeys > jo.total_journeys) errors.push('active_journeys > total_journeys');
  if (jo.completed_journeys > jo.total_journeys) errors.push('completed_journeys > total_journeys');
  if (jo.active_journeys + jo.completed_journeys > jo.total_journeys) {
    warnings.push('active_journeys + completed_journeys > total_journeys (possible if statuses overlap or data issues)');
  }

  // Status distribution sum should match total_journeys (if present)
  if (jo.status_distribution && typeof jo.status_distribution === 'object') {
    const sum = sumObjectValues(jo.status_distribution);
    if (sum !== jo.total_journeys) {
      warnings.push(`status_distribution sum (${sum}) != total_journeys (${jo.total_journeys})`);
    }
  }

  // avg_comments_per_journey should match total_comments/total_journeys
  const expectedAvg = jo.total_journeys > 0 ? Number((je.total_comments / jo.total_journeys).toFixed(2)) : 0;
  if (!approxEqual(expectedAvg, je.avg_comments_per_journey, 0.02)) {
    warnings.push(
      `avg_comments_per_journey mismatch: expected ~${expectedAvg} got ${je.avg_comments_per_journey} (${periodName})`
    );
  }

  // journey_trends sum should match total_journeys (if start_date parses reliably)
  if (Array.isArray(analytics.journey_trends) && analytics.journey_trends.length > 0) {
    const trendSum = analytics.journey_trends.reduce((acc, t) => acc + (typeof t.count === 'number' ? t.count : 0), 0);
    if (trendSum !== jo.total_journeys) {
      warnings.push(`journey_trends sum (${trendSum}) != total_journeys (${jo.total_journeys})`);
    }
  }

  // popular_destinations counts should be <= total_journeys
  if (Array.isArray(analytics.popular_destinations) && analytics.popular_destinations.length > 0) {
    for (const d of analytics.popular_destinations) {
      if (typeof d.count !== 'number') errors.push('popular_destinations.count is not a number');
      if (d.count < 0) warnings.push('popular_destinations has negative count');
    }
    const destSum = analytics.popular_destinations.reduce((acc, d) => acc + (typeof d.count === 'number' ? d.count : 0), 0);
    if (destSum > jo.total_journeys) warnings.push(`popular_destinations sum (${destSum}) > total_journeys (${jo.total_journeys})`);
  }

  // most_commented_journeys sanity
  if (Array.isArray(je.most_commented_journeys)) {
    for (const m of je.most_commented_journeys) {
      if (typeof m.comments !== 'number' || m.comments < 0) warnings.push('most_commented_journeys has invalid comments count');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function printHeadline(analytics, periodName) {
  logSection(`Metrics for ${periodName}`);
  const jo = analytics.journey_overview;
  const je = analytics.journey_engagement;
  console.log(`Total Journeys: ${jo.total_journeys}`);
  console.log(`Active Journeys: ${jo.active_journeys}`);
  console.log(`Completed Journeys: ${jo.completed_journeys}`);
  console.log(`Total Comments: ${je.total_comments}`);
  console.log(`Avg Comments/Journey: ${je.avg_comments_per_journey}`);
  console.log(`Avg Duration (days): ${jo.avg_journey_duration}`);
}

function crossPeriodChecks(results) {
  logSection('Cross-Period Checks (monotonic growth with bigger windows)');

  const byName = Object.fromEntries(results.filter(r => r.success).map(r => [r.periodName, r.data.data]));
  const order = ['Today', 'Last Week', 'Last Month', 'Last Year', 'All Time'];

  const present = order.filter(n => byName[n]);
  if (present.length < 2) {
    warn('Not enough successful periods for cross-period checks');
    return;
  }

  for (let i = 0; i < present.length - 1; i++) {
    const a = byName[present[i]];
    const b = byName[present[i + 1]];

    const aJourneys = a.journey_overview.total_journeys;
    const bJourneys = b.journey_overview.total_journeys;
    const aComments = a.journey_engagement.total_comments;
    const bComments = b.journey_engagement.total_comments;

    if (aJourneys > bJourneys) warn(`Total Journeys decreased from ${present[i]} (${aJourneys}) to ${present[i + 1]} (${bJourneys})`);
    else ok(`Total Journeys non-decreasing: ${present[i]} (${aJourneys}) <= ${present[i + 1]} (${bJourneys})`);

    if (aComments > bComments) warn(`Total Comments decreased from ${present[i]} (${aComments}) to ${present[i + 1]} (${bComments})`);
    else ok(`Total Comments non-decreasing: ${present[i]} (${aComments}) <= ${present[i + 1]} (${bComments})`);
  }

  // Custom is not necessarily monotonic vs these; just sanity
  if (byName['Custom (Last 14 days)']) {
    ok('Custom period fetched successfully');
  }
}

async function testPeriod(range) {
  logSection(`Testing: ${range.name}`);
  try {
    const payload = await fetchJourneyAnalytics(range.start, range.end, range.name);
    const structure = validateJourneyStructure(payload);
    if (!structure.valid) {
      fail(`Structure invalid for ${range.name}`);
      structure.errors.forEach(e => fail(`  - ${e}`));
      return { success: false, periodName: range.name, error: 'Structure invalid', payload };
    }
    structure.warnings.forEach(w => warn(`  - ${w}`));

    const inv = validateInvariants(payload.data, range.name);
    if (!inv.valid) {
      fail(`Invariant checks failed for ${range.name}`);
      inv.errors.forEach(e => fail(`  - ${e}`));
      inv.warnings.forEach(w => warn(`  - ${w}`));
      return { success: false, periodName: range.name, error: 'Invariant failure', data: payload, inv };
    }
    inv.warnings.forEach(w => warn(`  - ${w}`));

    ok(`${range.name} - OK`);
    printHeadline(payload.data, range.name);
    return { success: true, periodName: range.name, data: payload };
  } catch (e) {
    fail(`${range.name} - ${e.message}`);
    return { success: false, periodName: range.name, error: e.message };
  }
}

async function run() {
  logSection('Journey Analytics Time Period Tests');
  info(`Testing API at: ${API_BASE_URL}`);
  info(`Started at: ${new Date().toISOString()}`);

  const ranges = Object.values(getDateRanges());
  const results = [];

  for (const r of ranges) {
    results.push(await testPeriod(r));
    await new Promise(res => setTimeout(res, 400));
  }

  logSection('Test Summary');
  const okCount = results.filter(r => r.success).length;
  const badCount = results.length - okCount;
  console.log(`Total Periods Tested: ${results.length}`);
  ok(`Successful: ${okCount}`);
  if (badCount) fail(`Failed: ${badCount}`);

  if (badCount) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.success).forEach(r => fail(`- ${r.periodName}: ${r.error}`));
  }

  crossPeriodChecks(results);

  logSection('Done');
  info(`Completed at: ${new Date().toISOString()}`);
  process.exit(badCount ? 1 : 0);
}

run().catch((e) => {
  fail(`Fatal: ${e.message}`);
  process.exit(1);
});


