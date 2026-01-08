# Metrics Calculation Guide

This document explains how all analytics metrics are calculated in the NJEM Analytics Dashboard. Understanding these calculations will help you interpret the data correctly.

---

## Table of Contents

1. [Overview Analytics Metrics](#overview-analytics-metrics)
2. [User Analytics Metrics](#user-analytics-metrics)
3. [Time Period Filtering](#time-period-filtering)
4. [Data Sources](#data-sources)
5. [Key Concepts](#key-concepts)

---

## Overview Analytics Metrics

### Total Metrics

#### Total Users
- **Definition:** Total number of user accounts in the system
- **Calculation:** `COUNT(pandas_users)`
- **Time Period Impact:** ❌ **NOT filtered by time period** - always shows all users
- **Why:** This represents the total user base, regardless of when they registered

#### Active Users
- **Definition:** Users who have created at least one journey OR made at least one comment in the selected time period
- **Calculation:** 
  ```
  DISTINCT users from journeys WHERE start_date IN [period]
  UNION
  DISTINCT users from comments WHERE created_at IN [period]
  ```
- **Time Period Impact:** ✅ **Filtered by time period** - only counts users active in the selected period
- **Note:** Follows DAU/MAU (Daily/Monthly Active Users) standard metric

#### Total Journeys
- **Definition:** Number of journeys created in the selected time period
- **Calculation:** `COUNT(pandas_journey WHERE start_date IN [period])`
- **Time Period Impact:** ✅ **Filtered by time period**

#### Active Journeys
- **Definition:** Currently same as Total Journeys (all journeys in period are considered active)
- **Calculation:** Same as Total Journeys
- **Time Period Impact:** ✅ **Filtered by time period**

#### Total Comments
- **Definition:** Number of comments created in the selected time period
- **Calculation:** `COUNT(pandas_comments WHERE created_at IN [period])`
- **Time Period Impact:** ✅ **Filtered by time period**

#### Total Friendships
- **Definition:** Total number of friend connections in the system
- **Calculation:** `COUNT(pandas_friends)`
- **Time Period Impact:** ❌ **NOT filtered by time period** - shows all friendships

---

### Growth Metrics

Growth metrics compare the current period with the **previous period of equal duration**.

#### User Growth Rate
- **Definition:** Percentage change in active users compared to previous period
- **Calculation:**
  ```
  IF previous_period_active_users > 0:
    growth_rate = ((current_active_users - previous_active_users) / previous_active_users) × 100
  ELSE:
    growth_rate = 0
  ```
- **Example:** If previous period had 10 active users and current period has 15:
  - Growth Rate = ((15 - 10) / 10) × 100 = **+50.0%**
- **Time Period Impact:** Only calculated when both start and end dates are provided

#### Journey Growth Rate
- **Definition:** Percentage change in journeys created compared to previous period
- **Calculation:**
  ```
  IF previous_period_journeys > 0:
    growth_rate = ((current_journeys - previous_journeys) / previous_journeys) × 100
  ELSE:
    growth_rate = 0
  ```
- **Time Period Impact:** Only calculated when both start and end dates are provided

#### Engagement Growth Rate
- **Definition:** Percentage change in total engagement (journeys + comments) compared to previous period
- **Calculation:**
  ```
  current_engagement = current_journeys + current_comments
  previous_engagement = previous_journeys + previous_comments
  
  IF previous_engagement > 0:
    growth_rate = ((current_engagement - previous_engagement) / previous_engagement) × 100
  ELSE:
    growth_rate = 0
  ```
- **Time Period Impact:** Only calculated when both start and end dates are provided

---

### Engagement Metrics

#### Average Comments per Journey
- **Definition:** Average number of comments per journey in the selected period
- **Calculation:**
  ```
  IF total_journeys > 0:
    avg = total_comments / total_journeys
  ELSE:
    avg = 0
  ```
- **Time Period Impact:** ✅ **Filtered by time period**

#### Average Friends per User
- **Definition:** Average number of friends per user across all users
- **Calculation:**
  ```
  avg = total_friendships / total_users
  ```
- **Time Period Impact:** ❌ **NOT filtered by time period** - uses all users and all friendships

#### Engagement Rate
- **Definition:** Percentage of total users who are active in the selected period
- **Calculation:**
  ```
  engagement_rate = (active_users / total_users) × 100
  ```
- **Time Period Impact:** ✅ **Filtered by time period** (active users are filtered)

---

## User Analytics Metrics

### User Demographics

#### Total Users
- **Definition:** Total number of user accounts in the system
- **Calculation:** `COUNT(pandas_users)`
- **Time Period Impact:** ❌ **NOT filtered by time period** - always shows all users
- **Why:** Represents the total user base

#### Active Users
- **Definition:** Users who have created at least one journey OR made at least one comment in the selected time period
- **Calculation:** Same as Overview Analytics Active Users
- **Time Period Impact:** ✅ **Filtered by time period**

#### New Users
- **Definition:** Users who registered during the selected time period
- **Calculation:** `COUNT(pandas_users WHERE createdAt IN [period])`
- **Special Case:** If no time period is selected (All Time), defaults to last 30 days
- **Time Period Impact:** ✅ **Filtered by time period**

#### Gender Distribution
- **Definition:** Breakdown of users by gender
- **Calculation:** `GROUP BY gender FROM pandas_users WHERE createdAt IN [period]`
- **Time Period Impact:** ✅ **Filtered by time period** (only counts users registered in period)

---

### User Activity

#### Average Journeys per User
- **Definition:** Average number of journeys created per user in the selected period
- **Calculation:**
  ```
  avg = total_journeys_in_period / total_users
  ```
- **Note:** Uses total users (not filtered), but journeys are filtered by period
- **Time Period Impact:** ✅ **Filtered by time period** (journeys only)

#### Average Comments per User
- **Definition:** Average number of comments made per user in the selected period
- **Calculation:**
  ```
  avg = total_comments_in_period / total_users
  ```
- **Time Period Impact:** ✅ **Filtered by time period** (comments only)

#### Average Friends per User
- **Definition:** Average number of friends per user across all users
- **Calculation:**
  ```
  avg = total_friendships / total_users
  ```
- **Time Period Impact:** ❌ **NOT filtered by time period** - uses all friendships

#### Most Active Users
- **Definition:** Top users ranked by activity score in the selected period
- **Calculation:**
  ```
  Activity Score = (number of journeys) + (number of comments × 0.5)
  
  For each user:
    1. Count journeys WHERE start_date IN [period]
    2. Count comments WHERE created_at IN [period]
    3. Calculate activity_score = journeys + (comments × 0.5)
    4. Sort by activity_score DESC
    5. Return top N users
  ```
- **Time Period Impact:** ✅ **Filtered by time period** (activities only)

---

### User Retention

#### Retention Rate
- **Definition:** Percentage of users who were active in the previous period and are still active in the current period
- **Calculation:**
  ```
  previous_period_active_users = active users in period before [start_date]
  returning_users = users active in BOTH previous AND current period
  
  IF previous_period_active_users > 0:
    retention_rate = (returning_users / previous_period_active_users) × 100
  ELSE:
    retention_rate = engagement_rate (fallback)
  ```
- **Time Period Impact:** Only calculated when both start and end dates are provided
- **Example:** If 10 users were active last month, and 7 of them are still active this month:
  - Retention Rate = (7 / 10) × 100 = **70.0%**

#### Churn Rate
- **Definition:** Percentage of users who were active in the previous period but are NOT active in the current period
- **Calculation:**
  ```
  IF previous_period_active_users > 0:
    churn_rate = ((previous_period_active_users - returning_users) / previous_period_active_users) × 100
  ELSE:
    churn_rate = 100 - engagement_rate (fallback)
  ```
- **Time Period Impact:** Only calculated when both start and end dates are provided
- **Note:** Retention Rate + Churn Rate = 100% (for users from previous period)

#### Returning Users
- **Definition:** Count of users who were active in both the previous period and current period
- **Calculation:** `COUNT(users active in previous period AND current period)`
- **Time Period Impact:** Only calculated when both start and end dates are provided

---

### Registration Trends

- **Definition:** Monthly breakdown of new user registrations
- **Calculation:**
  ```
  GROUP BY MONTH(createdAt) FROM pandas_users WHERE createdAt IN [period]
  ```
- **Format:** Array of `{month: "YYYY-MM", count: number}`
- **Time Period Impact:** ✅ **Filtered by time period**

---

### Activity Distribution

- **Definition:** Categorization of users by their weekly activity rate
- **Calculation:**
  ```
  1. Calculate weeks in period:
     weeks = days_in_period / 7
  
  2. For each user, count activities in period:
     activities = journeys_in_period + comments_in_period
  
  3. Calculate activities per week:
     activities_per_week = activities / weeks
  
  4. Categorize:
     - Inactive: activities_per_week < 1.0
     - Medium: 1.0 ≤ activities_per_week < 3.0
     - Active: activities_per_week ≥ 3.0
  ```
- **Time Period Impact:** ✅ **Filtered by time period** (activities only)
- **Note:** Uses ALL users but only counts their activities within the selected period

---

## Time Period Filtering

### How Time Periods Work

When you select a time period (Today, Last Week, Last Month, etc.), the system:

1. **Calculates the date range** based on the selected period
2. **Applies filters** to activities (journeys, comments) that occurred within that range
3. **Preserves total counts** for metrics that shouldn't be filtered (like Total Users)

### Date Field Mapping

| Collection | Date Field | Used For |
|------------|-----------|----------|
| `pandas_users` | `createdAt` | New users, registration trends, gender distribution |
| `pandas_journey` | `start_date` | Journey counts, active users (via journeys) |
| `pandas_comments` | `created_at` | Comment counts, active users (via comments) |
| `pandas_friends` | N/A | Total friendships (not date-filtered) |

### Time Period Examples

#### "Today"
- **Start:** 00:00:00 of current day
- **End:** 23:59:59 of current day
- **Filters:** Only activities from today

#### "Last Week"
- **Start:** 7 days ago (including today)
- **End:** End of today
- **Filters:** Activities from last 7 days

#### "Last Month"
- **Start:** 30 days ago (including today)
- **End:** End of today
- **Filters:** Activities from last 30 days

#### "All Time"
- **Start:** None
- **End:** None
- **Filters:** No date filtering applied (shows all data)

---

## Data Sources

### MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| `pandas_users` | User accounts and demographics |
| `pandas_journey` | Travel journeys created by users |
| `pandas_comments` | Comments made on journeys |
| `pandas_friends` | Friend connections between users |

### Key Fields

**pandas_users:**
- `_id`: User ID
- `createdAt`: Registration date (ISO string)
- `gender`: User gender
- `firstName`, `lastName`, `userName`: User names

**pandas_journey:**
- `_id`: Journey ID
- `user_id`: Creator user ID
- `start_date`: Journey start date (Date or ISO string)

**pandas_comments:**
- `_id`: Comment ID
- `user_id`: Commenter user ID
- `created_at`: Comment creation date (Date or ISO string)

**pandas_friends:**
- `_id`: Friendship ID
- `follower_id`, `followee_id`: User IDs in the friendship

---

## Key Concepts

### Active Users Definition

**Active Users** are defined as users who have:
- Created at least one journey **OR**
- Made at least one comment

in the selected time period.

This follows the industry-standard **DAU/MAU** (Daily/Monthly Active Users) metric, which focuses on core engagement activities.

### Why Some Metrics Aren't Filtered

Some metrics like **Total Users** and **Total Friendships** are **not** filtered by time period because:

1. **Total Users** represents the entire user base - filtering by date would only show users registered in that period, not the actual total
2. **Total Friendships** represents all connections - filtering would require a date field on friendships, which may not exist

### Growth Rate Calculation

Growth rates compare the **current period** with the **previous period of equal duration**:

```
Previous Period: [start_date - duration] to [start_date]
Current Period:  [start_date] to [end_date]
```

This ensures fair comparison between periods of the same length.

### Activity Score Formula

For ranking most active users:

```
Activity Score = (Journeys × 1.0) + (Comments × 0.5)
```

Journeys are weighted more heavily because they represent primary content creation, while comments represent engagement.

### Engagement vs Retention

- **Engagement Rate:** What % of ALL users are active in the current period
- **Retention Rate:** What % of PREVIOUSLY ACTIVE users came back

These are different metrics:
- High engagement rate = many users are active
- High retention rate = users who were active before are staying active

---

## Common Questions

### Q: Why does "Total Users" stay the same across all time periods?

**A:** Total Users represents the entire user base, not just users active in a period. It's not date-filtered to show the true total.

### Q: Why are Active Users different between Overview and User Analytics?

**A:** They use the same calculation, so they should match. If they differ, it may be due to:
- Different time periods selected
- Caching differences
- Calculation timing

### Q: How is "New Users" calculated for "All Time"?

**A:** When no time period is selected, "New Users" defaults to the **last 30 days** to provide a meaningful recent metric.

### Q: Why is Activity Distribution showing all users as "Inactive"?

**A:** This happens when:
- The selected time period is very short (e.g., "Today")
- Users haven't had enough time to accumulate weekly activities
- The calculation divides activities by weeks, so short periods result in low weekly rates

### Q: What's the difference between "Engagement Rate" and "Retention Rate"?

**A:**
- **Engagement Rate:** (Active Users / Total Users) × 100 - measures current activity
- **Retention Rate:** (Returning Users / Previous Period Active Users) × 100 - measures user return behavior

---

## Summary

- **Total metrics** (users, friendships) are typically NOT filtered by time period
- **Activity metrics** (journeys, comments, active users) ARE filtered by time period
- **Growth rates** compare current period with previous period of equal duration
- **Retention metrics** require both start and end dates to calculate
- **Activity distribution** normalizes activities by weeks in the period

Understanding these calculations will help you interpret the dashboard data accurately and make informed decisions based on the metrics.

