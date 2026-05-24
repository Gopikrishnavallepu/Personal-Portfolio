# 🔗 Live Data Pipeline — Wiz API + SQL CMDB + ServiceNow → Power BI

> **Goal:** Automate daily data extraction from 3 sources using Python,
> store in a central SQL database, and connect Power BI with scheduled refresh.
> Present to leadership monthly with zero manual data prep.

---

# ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LIVE DATA PIPELINE ARCHITECTURE                          │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐                           │
│  │  WIZ      │    │  CMDB    │    │  SERVICENOW  │                           │
│  │  (API)    │    │  (SQL)   │    │  (REST API)  │                           │
│  └─────┬────┘    └────┬─────┘    └──────┬───────┘                           │
│        │              │                  │                                    │
│        ▼              ▼                  ▼                                    │
│  ┌─────────────────────────────────────────────────┐                        │
│  │           PYTHON ETL SCRIPTS                     │                        │
│  │                                                  │                        │
│  │  extract_wiz.py     → wiz_findings table         │                        │
│  │  extract_cmdb.py    → cmdb_assets table          │                        │
│  │  extract_snow.py    → servicenow_tickets table   │                        │
│  │  run_pipeline.py    → orchestrator (runs all 3)  │                        │
│  └──────────────────────┬───────────────────────────┘                        │
│                         │                                                    │
│                         ▼                                                    │
│  ┌──────────────────────────────────────────────────┐                        │
│  │          SQL SERVER / POSTGRESQL                   │                        │
│  │          (Central Data Warehouse)                  │                        │
│  │                                                    │                        │
│  │  security_dashboard.wiz_findings                   │                        │
│  │  security_dashboard.cmdb_assets                    │                        │
│  │  security_dashboard.servicenow_tickets             │                        │
│  │  security_dashboard.refresh_log                    │                        │
│  └──────────────────────┬────────────────────────────┘                        │
│                         │                                                    │
│                         ▼                                                    │
│  ┌──────────────────────────────────────────────────┐                        │
│  │          POWER BI                                  │                        │
│  │  DirectQuery / Import + Scheduled Refresh          │                        │
│  │                                                    │                        │
│  │  Page 1: CEO Risk Overview                         │                        │
│  │  Page 2: SLA Operations                            │                        │
│  │  Page 3: Posture Improvement                       │                        │
│  └────────────────────────────────────────────────────┘                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────┐                       │
│  │  SCHEDULER                                          │                       │
│  │  Windows Task Scheduler / cron / Azure Function     │                       │
│  │  Runs: daily at 6:00 AM UTC                         │                       │
│  └────────────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: PREREQUISITES & SETUP

## 1.1 Install Python Dependencies

```bash
# Create a virtual environment for the pipeline
python -m venv C:\SecurityDashboard\venv
C:\SecurityDashboard\venv\Scripts\activate

# Install required packages
pip install requests         # HTTP calls to Wiz & ServiceNow APIs
pip install pyodbc           # SQL Server connection
pip install psycopg2-binary  # PostgreSQL connection (alternative)
pip install sqlalchemy       # ORM for database operations
pip install pandas           # Data manipulation
pip install python-dotenv    # Environment variable management
pip install schedule         # Task scheduling (optional)
pip install logging          # Already built-in, just import
```

## 1.2 Project Folder Structure

```
C:\SecurityDashboard\
├── .env                      # API keys and DB credentials (NEVER commit)
├── config.py                 # Configuration loader
├── extract_wiz.py            # Wiz API extractor
├── extract_cmdb.py           # SQL CMDB extractor
├── extract_snow.py           # ServiceNow API extractor
├── run_pipeline.py           # Orchestrator — runs all 3 + logs results
├── db_setup.py               # Creates tables in SQL Server
├── requirements.txt          # pip freeze output
└── logs/
    └── pipeline.log          # Execution logs
```

## 1.3 Environment Variables (`.env` file)

```env
# ========================
# WIZ API CREDENTIALS
# ========================
WIZ_CLIENT_ID=your-wiz-service-account-client-id
WIZ_CLIENT_SECRET=your-wiz-service-account-client-secret
WIZ_API_URL=https://api.us20.app.wiz.io/graphql
WIZ_AUTH_URL=https://auth.app.wiz.io/oauth/token
WIZ_AUDIENCE=wiz-api

# ========================
# SQL SERVER (CMDB + Data Warehouse)
# ========================
SQL_SERVER=your-sql-server.database.windows.net
SQL_DATABASE=security_dashboard
SQL_USERNAME=dashboard_svc_account
SQL_PASSWORD=your-strong-password
SQL_DRIVER=ODBC Driver 17 for SQL Server

# CMDB is on a DIFFERENT SQL server (or same server, different DB)
CMDB_SQL_SERVER=cmdb-server.database.windows.net
CMDB_SQL_DATABASE=cmdb_production
CMDB_SQL_USERNAME=cmdb_readonly_user
CMDB_SQL_PASSWORD=cmdb-readonly-password

# ========================
# SERVICENOW API CREDENTIALS
# ========================
SNOW_INSTANCE=yourcompany.service-now.com
SNOW_USERNAME=api_dashboard_user
SNOW_PASSWORD=your-snow-password
# OR use OAuth:
# SNOW_CLIENT_ID=your-snow-oauth-client-id
# SNOW_CLIENT_SECRET=your-snow-oauth-client-secret
```

---

# PART 2: CONFIGURATION MODULE

## `config.py`

```python
"""
config.py — Loads credentials from .env file
WHY: Never hardcode API keys or passwords in scripts.
     .env file stays on the server, never in git.
"""

import os
from dotenv import load_dotenv

load_dotenv()  # Reads .env file and sets environment variables

class Config:
    # ── Wiz API ──────────────────────────────────────────────
    WIZ_CLIENT_ID     = os.getenv("WIZ_CLIENT_ID")
    WIZ_CLIENT_SECRET = os.getenv("WIZ_CLIENT_SECRET")
    WIZ_API_URL       = os.getenv("WIZ_API_URL")
    WIZ_AUTH_URL      = os.getenv("WIZ_AUTH_URL")
    WIZ_AUDIENCE      = os.getenv("WIZ_AUDIENCE", "wiz-api")

    # ── SQL Server (Data Warehouse) ──────────────────────────
    SQL_SERVER    = os.getenv("SQL_SERVER")
    SQL_DATABASE  = os.getenv("SQL_DATABASE")
    SQL_USERNAME  = os.getenv("SQL_USERNAME")
    SQL_PASSWORD  = os.getenv("SQL_PASSWORD")
    SQL_DRIVER    = os.getenv("SQL_DRIVER", "ODBC Driver 17 for SQL Server")

    # ── CMDB SQL Server ──────────────────────────────────────
    CMDB_SQL_SERVER   = os.getenv("CMDB_SQL_SERVER")
    CMDB_SQL_DATABASE = os.getenv("CMDB_SQL_DATABASE")
    CMDB_SQL_USERNAME = os.getenv("CMDB_SQL_USERNAME")
    CMDB_SQL_PASSWORD = os.getenv("CMDB_SQL_PASSWORD")

    # ── ServiceNow ───────────────────────────────────────────
    SNOW_INSTANCE = os.getenv("SNOW_INSTANCE")
    SNOW_USERNAME = os.getenv("SNOW_USERNAME")
    SNOW_PASSWORD = os.getenv("SNOW_PASSWORD")

    @classmethod
    def get_warehouse_connection_string(cls):
        """SQLAlchemy connection string for the data warehouse."""
        return (
            f"mssql+pyodbc://{cls.SQL_USERNAME}:{cls.SQL_PASSWORD}"
            f"@{cls.SQL_SERVER}/{cls.SQL_DATABASE}"
            f"?driver={cls.SQL_DRIVER.replace(' ', '+')}"
        )

    @classmethod
    def get_cmdb_connection_string(cls):
        """SQLAlchemy connection string for the CMDB database."""
        return (
            f"mssql+pyodbc://{cls.CMDB_SQL_USERNAME}:{cls.CMDB_SQL_PASSWORD}"
            f"@{cls.CMDB_SQL_SERVER}/{cls.CMDB_SQL_DATABASE}"
            f"?driver={cls.SQL_DRIVER.replace(' ', '+')}"
        )
```

---

# PART 3: DATABASE SETUP

## `db_setup.py`

```python
"""
db_setup.py — Creates the data warehouse tables.
Run ONCE to initialize the database schema.
"""

from sqlalchemy import create_engine, text
from config import Config

def create_tables():
    engine = create_engine(Config.get_warehouse_connection_string())

    with engine.connect() as conn:
        # ── Create schema ────────────────────────────────────
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dashboard')
                EXEC('CREATE SCHEMA dashboard')
        """))

        # ── Table 1: Wiz Findings ────────────────────────────
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES
                           WHERE TABLE_SCHEMA = 'dashboard'
                           AND TABLE_NAME = 'wiz_findings')
            CREATE TABLE dashboard.wiz_findings (
                finding_id          NVARCHAR(50) PRIMARY KEY,
                title               NVARCHAR(500),
                severity            NVARCHAR(20),      -- CRITICAL, HIGH, MEDIUM, LOW
                status              NVARCHAR(20),      -- Open, Closed, Resolved
                category            NVARCHAR(100),     -- Network, IAM, Storage, etc.
                cloud_provider      NVARCHAR(20),      -- Azure, GCP, AWS
                cloud_account       NVARCHAR(100),
                resource_id         NVARCHAR(500),
                resource_type       NVARCHAR(100),
                resource_name       NVARCHAR(200),
                region              NVARCHAR(50),
                internet_facing     NVARCHAR(5),       -- Yes / No
                data_classification NVARCHAR(50),      -- Confidential, Restricted, etc.
                compliance_framework NVARCHAR(100),    -- CIS Azure 3.7, etc.
                cis_control         NVARCHAR(20),
                created_date        DATE,
                closed_date         DATE NULL,
                sla_hours           INT,
                assignee            NVARCHAR(100) NULL,
                assignment_group    NVARCHAR(100) NULL,
                last_refreshed      DATETIME DEFAULT GETDATE()
            )
        """))

        # ── Table 2: CMDB Assets ─────────────────────────────
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES
                           WHERE TABLE_SCHEMA = 'dashboard'
                           AND TABLE_NAME = 'cmdb_assets')
            CREATE TABLE dashboard.cmdb_assets (
                ci_id               NVARCHAR(50) PRIMARY KEY,
                cloud_resource_id   NVARCHAR(500),     -- JOIN key to wiz_findings.resource_id
                ci_name             NVARCHAR(200),
                owner               NVARCHAR(100),
                owner_email         NVARCHAR(200),
                assignment_group    NVARCHAR(100),
                environment         NVARCHAR(20),      -- Production, Development, Corporate
                application         NVARCHAR(200),
                support_group       NVARCHAR(100),
                operational_status  NVARCHAR(20),
                cloud_provider      NVARCHAR(20),
                cloud_account       NVARCHAR(100),
                region              NVARCHAR(50),
                business_unit       NVARCHAR(100),
                data_classification NVARCHAR(50),
                manager             NVARCHAR(100),
                last_refreshed      DATETIME DEFAULT GETDATE()
            )
        """))

        # ── Table 3: ServiceNow Tickets ──────────────────────
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES
                           WHERE TABLE_SCHEMA = 'dashboard'
                           AND TABLE_NAME = 'servicenow_tickets')
            CREATE TABLE dashboard.servicenow_tickets (
                ticket_id           NVARCHAR(50) PRIMARY KEY,
                finding_id          NVARCHAR(50),      -- JOIN key to wiz_findings
                short_description   NVARCHAR(500),
                priority            NVARCHAR(5),       -- P1, P2, P3, P4
                status              NVARCHAR(20),      -- Open, Closed, In Progress
                assignment_group    NVARCHAR(100),
                assigned_to         NVARCHAR(100),
                created_date        DATE,
                resolved_date       DATE NULL,
                sla_target_date     DATE NULL,
                sla_status          NVARCHAR(20),      -- Met, Breached, On Track, At Risk
                resolution_notes    NVARCHAR(MAX) NULL,
                change_request_id   NVARCHAR(50) NULL,
                last_refreshed      DATETIME DEFAULT GETDATE()
            )
        """))

        # ── Table 4: Refresh Log (audit trail) ───────────────
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES
                           WHERE TABLE_SCHEMA = 'dashboard'
                           AND TABLE_NAME = 'refresh_log')
            CREATE TABLE dashboard.refresh_log (
                id              INT IDENTITY(1,1) PRIMARY KEY,
                source          NVARCHAR(50),      -- 'wiz', 'cmdb', 'servicenow'
                status          NVARCHAR(20),      -- 'success', 'failed'
                rows_processed  INT,
                start_time      DATETIME,
                end_time        DATETIME,
                error_message   NVARCHAR(MAX) NULL
            )
        """))

        conn.commit()
        print("✅ All tables created successfully.")

if __name__ == "__main__":
    create_tables()
```

---

# PART 4: PYTHON EXTRACTORS

## 4.1 `extract_wiz.py` — Wiz GraphQL API

```python
"""
extract_wiz.py — Pulls findings from Wiz via GraphQL API

HOW WIZ API WORKS:
1. Authenticate with client_id + client_secret → get OAuth token
2. Send GraphQL query to fetch Issues (findings)
3. Wiz paginates results — loop until all pages retrieved
4. Transform JSON → DataFrame → SQL Server

AUTHENTICATION:
  Wiz uses service accounts (not user accounts).
  Create one at: Wiz Console → Settings → Service Accounts
  Grant it "read:issues" scope (minimum privilege).
"""

import requests
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine
from config import Config
import logging

logger = logging.getLogger(__name__)


def get_wiz_token():
    """
    Step 1: Get OAuth2 access token from Wiz.

    WHY OAuth: Wiz doesn't use API keys. It uses OAuth2 client_credentials flow.
    The token expires after 24 hours — we get a fresh one each pipeline run.
    """
    response = requests.post(
        Config.WIZ_AUTH_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "client_credentials",
            "client_id": Config.WIZ_CLIENT_ID,
            "client_secret": Config.WIZ_CLIENT_SECRET,
            "audience": Config.WIZ_AUDIENCE,
        },
    )
    response.raise_for_status()
    token = response.json()["access_token"]
    logger.info("✅ Wiz authentication successful")
    return token


def fetch_wiz_findings(token):
    """
    Step 2: Query Wiz GraphQL API for all open and recently closed findings.

    WHY GraphQL: Wiz uses GraphQL (not REST). You send a query string
    that specifies exactly which fields you want. This is more efficient
    than REST because you only get the fields you need.

    PAGINATION: Wiz returns max 500 results per page. We use cursor-based
    pagination (after: $endCursor) to get all pages.
    """

    # The GraphQL query — asks for specific fields we need for the dashboard
    query = """
    query GetIssues($first: Int, $after: String, $filterBy: IssueFilters) {
        issues(first: $first, after: $after, filterBy: $filterBy) {
            nodes {
                id
                sourceRule {
                    name
                }
                severity
                status
                type
                entitySnapshot {
                    cloudProvider
                    subscriptionExternalId
                    nativeType
                    name
                    region
                    externalId
                    tags
                }
                projects {
                    name
                }
                notes {
                    text
                }
                createdAt
                resolvedAt
                dueAt
                control {
                    name
                    controlId
                    securityFrameworks {
                        name
                        category {
                            name
                        }
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
            totalCount
        }
    }
    """

    all_findings = []
    has_next_page = True
    cursor = None
    page = 1

    while has_next_page:
        variables = {
            "first": 500,               # Max 500 per page
            "after": cursor,
            "filterBy": {
                "status": ["OPEN", "RESOLVED", "REJECTED"],
                # Fetch all statuses so we can track closure trends
                # Filter to last 180 days to keep dataset manageable
            },
        }

        response = requests.post(
            Config.WIZ_API_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={"query": query, "variables": variables},
        )
        response.raise_for_status()
        data = response.json()["data"]["issues"]

        all_findings.extend(data["nodes"])
        has_next_page = data["pageInfo"]["hasNextPage"]
        cursor = data["pageInfo"]["endCursor"]

        logger.info(f"  Page {page}: fetched {len(data['nodes'])} issues "
                     f"(total so far: {len(all_findings)}/{data['totalCount']})")
        page += 1

    logger.info(f"✅ Fetched {len(all_findings)} total Wiz findings")
    return all_findings


def transform_wiz_findings(raw_findings):
    """
    Step 3: Transform Wiz JSON into a flat DataFrame matching our SQL schema.

    WHY TRANSFORM: Wiz returns nested JSON (entity → cloudProvider, control →
    frameworks → category). We flatten it into simple columns for SQL/Power BI.
    """
    records = []
    for f in raw_findings:
        entity = f.get("entitySnapshot", {}) or {}
        control = f.get("control", {}) or {}

        # Extract compliance framework from nested structure
        frameworks = control.get("securityFrameworks", []) or []
        compliance_fw = frameworks[0]["name"] if frameworks else ""
        cis_category = ""
        if frameworks and frameworks[0].get("category"):
            cis_category = frameworks[0]["category"]["name"]

        # Determine data classification from tags
        tags = entity.get("tags", {}) or {}
        data_class = tags.get("data-classification", "Internal")

        # Determine internet-facing (Wiz has this as a graph property)
        # Simplified: check if type contains "public" or tags indicate it
        internet_facing = "No"  # Default; Wiz Attack Path analysis
                                # provides this via separate graph query

        # Map Wiz severity to SLA hours (your org's SLA policy)
        severity = f.get("severity", "MEDIUM")
        sla_map = {"CRITICAL": 24, "HIGH": 168, "MEDIUM": 720, "LOW": 2160}
        sla_hours = sla_map.get(severity, 720)

        records.append({
            "finding_id": f["id"],
            "title": (f.get("sourceRule", {}) or {}).get("name", "Unknown"),
            "severity": severity,
            "status": "Open" if f["status"] == "OPEN" else "Closed",
            "category": f.get("type", "Unknown"),
            "cloud_provider": entity.get("cloudProvider", "Unknown"),
            "cloud_account": entity.get("subscriptionExternalId", ""),
            "resource_id": entity.get("externalId", ""),
            "resource_type": entity.get("nativeType", ""),
            "resource_name": entity.get("name", ""),
            "region": entity.get("region", "global"),
            "internet_facing": internet_facing,
            "data_classification": data_class,
            "compliance_framework": compliance_fw,
            "cis_control": control.get("controlId", ""),
            "created_date": f.get("createdAt", "")[:10],  # YYYY-MM-DD
            "closed_date": (f.get("resolvedAt") or "")[:10] or None,
            "sla_hours": sla_hours,
            "assignee": None,        # Populated from CMDB join
            "assignment_group": None, # Populated from CMDB join
        })

    df = pd.DataFrame(records)
    logger.info(f"✅ Transformed {len(df)} findings into DataFrame")
    return df


def load_wiz_findings(df):
    """
    Step 4: Load transformed data into SQL Server.

    WHY TRUNCATE+INSERT (not UPSERT): For dashboard data, a full refresh
    is simpler and ensures no stale records. Wiz findings change status
    frequently — full refresh catches all changes.
    """
    engine = create_engine(Config.get_warehouse_connection_string())

    with engine.connect() as conn:
        # Truncate existing data (full refresh pattern)
        conn.execute("TRUNCATE TABLE dashboard.wiz_findings")
        conn.commit()

    # Bulk insert using pandas
    df.to_sql(
        name="wiz_findings",
        schema="dashboard",
        con=engine,
        if_exists="append",    # Table already exists (truncated above)
        index=False,
        method="multi",        # Batch insert for performance
        chunksize=500,
    )
    logger.info(f"✅ Loaded {len(df)} findings into SQL Server")
    return len(df)


def run():
    """Main entry point — called by orchestrator."""
    start = datetime.now()
    try:
        token = get_wiz_token()
        raw = fetch_wiz_findings(token)
        df = transform_wiz_findings(raw)
        rows = load_wiz_findings(df)
        return {"status": "success", "rows": rows,
                "start": start, "end": datetime.now()}
    except Exception as e:
        logger.error(f"❌ Wiz extraction failed: {e}")
        return {"status": "failed", "rows": 0,
                "start": start, "end": datetime.now(), "error": str(e)}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = run()
    print(result)
```

---

## 4.2 `extract_cmdb.py` — SQL Server CMDB

```python
"""
extract_cmdb.py — Pulls asset inventory from CMDB SQL database

HOW THIS WORKS:
  CMDB data lives in a SQL Server database (typically ServiceNow's
  underlying DB, or a replicated CMDB warehouse). We query it directly
  with a SQL SELECT and copy the results into our dashboard warehouse.

WHY SEPARATE DB: The CMDB is a production system — we NEVER run
  Power BI directly against it (performance impact). Instead, we copy
  the relevant subset into our dashboard warehouse.

INTERVIEW EXPLANATION:
  "I don't connect Power BI directly to the CMDB because it's a production
   system with thousands of concurrent users. Instead, I run a nightly
   Python ETL that copies the relevant asset records into a dedicated
   dashboard warehouse. This isolates the dashboard from CMDB performance
   and lets me add dashboard-specific indexes."
"""

import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine
from config import Config
import logging

logger = logging.getLogger(__name__)


def extract_from_cmdb():
    """
    Step 1: Query CMDB for cloud asset records.

    WHY THIS QUERY: We only pull assets that are:
    - Cloud resources (Azure or GCP)
    - Active status
    - Owned by our organization

    We don't pull ALL CMDB records — just the subset relevant to
    cloud security findings.
    """
    engine = create_engine(Config.get_cmdb_connection_string())

    query = """
    SELECT
        ci.ci_id,
        ci.cloud_resource_id,   -- This is the JOIN key to Wiz findings
        ci.ci_name,
        ci.owner,
        ci.owner_email,
        ci.assignment_group,
        ci.environment,
        ci.application,
        ci.support_group,
        ci.operational_status,
        ci.cloud_provider,
        ci.cloud_account,
        ci.region,
        ci.business_unit,
        ci.data_classification,
        ci.manager
    FROM dbo.cmdb_ci_cloud_resources ci
    WHERE ci.operational_status = 'Active'
      AND ci.cloud_provider IN ('Azure', 'GCP', 'AWS')
    ORDER BY ci.cloud_provider, ci.business_unit
    """

    # Alternative: If your CMDB uses ServiceNow table structure:
    # query = """
    #     SELECT
    #         sys_id as ci_id,
    #         u_cloud_resource_id as cloud_resource_id,
    #         name as ci_name,
    #         owned_by.name as owner,
    #         owned_by.email as owner_email,
    #         assignment_group.name as assignment_group,
    #         u_environment as environment,
    #         u_application as application,
    #         support_group.name as support_group,
    #         operational_status as operational_status,
    #         u_cloud_provider as cloud_provider,
    #         u_cloud_account as cloud_account,
    #         u_region as region,
    #         u_business_unit as business_unit,
    #         u_data_classification as data_classification,
    #         managed_by.name as manager
    #     FROM cmdb_ci_cloud_service
    #     WHERE operational_status = 1  -- Active
    # """

    df = pd.read_sql(query, engine)
    logger.info(f"✅ Extracted {len(df)} assets from CMDB")
    return df


def load_cmdb_assets(df):
    """
    Step 2: Full-refresh load into dashboard warehouse.
    """
    engine = create_engine(Config.get_warehouse_connection_string())

    with engine.connect() as conn:
        conn.execute("TRUNCATE TABLE dashboard.cmdb_assets")
        conn.commit()

    df.to_sql(
        name="cmdb_assets",
        schema="dashboard",
        con=engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=500,
    )
    logger.info(f"✅ Loaded {len(df)} assets into dashboard warehouse")
    return len(df)


def run():
    """Main entry point."""
    start = datetime.now()
    try:
        df = extract_from_cmdb()
        rows = load_cmdb_assets(df)
        return {"status": "success", "rows": rows,
                "start": start, "end": datetime.now()}
    except Exception as e:
        logger.error(f"❌ CMDB extraction failed: {e}")
        return {"status": "failed", "rows": 0,
                "start": start, "end": datetime.now(), "error": str(e)}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = run()
    print(result)
```

---

## 4.3 `extract_snow.py` — ServiceNow REST API

```python
"""
extract_snow.py — Pulls security tickets from ServiceNow Table API

HOW SERVICENOW API WORKS:
  ServiceNow exposes every table via REST API at:
  https://<instance>.service-now.com/api/now/table/<table_name>

  We query the "incident" table (or a custom "u_security_findings" table)
  filtered by category = "Security".

AUTHENTICATION:
  - Basic Auth: username + password (simple but works)
  - OAuth2: client_id + client_secret (better for production)
  We support both in this script.

PAGINATION:
  ServiceNow returns max 10,000 per request. We use sysparm_offset
  to paginate through all records.

INTERVIEW EXPLANATION:
  "I pull security tickets from ServiceNow via the Table API. The query
   filters by assignment group matching our cloud security teams, and
   I include both open and recently closed tickets to track MTTR trends.
   The data refreshes daily at 6 AM, and Power BI picks it up within
   an hour via scheduled refresh."
"""

import requests
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from config import Config
import logging

logger = logging.getLogger(__name__)


def fetch_snow_tickets():
    """
    Step 1: Query ServiceNow Table API for security tickets.

    QUERY PARAMETERS EXPLAINED:
    - sysparm_query: Filter expression (like SQL WHERE clause)
    - sysparm_fields: Which fields to return (like SQL SELECT)
    - sysparm_limit: Max records per page (10000 max)
    - sysparm_offset: For pagination
    - sysparm_display_value: true = show display names, not sys_ids
    """
    base_url = f"https://{Config.SNOW_INSTANCE}/api/now/table/incident"

    # ServiceNow query language (encoded):
    # - Get tickets from specific assignment groups (cloud security teams)
    # - Created in last 180 days (or all open regardless of date)
    # - Ordered by created_on descending

    # Our cloud security teams
    security_groups = [
        "Platform-Engineering",
        "Network-Operations",
        "AppDev-Team",
        "Data-Engineering",
        "Container-Platform",
        "Identity-Security",
    ]
    group_filter = "^OR".join([f"assignment_group.name={g}" for g in security_groups])

    # Date filter: tickets created in last 180 days OR still open
    six_months_ago = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")

    query = (
        f"({group_filter})"
        f"^sys_created_on>={six_months_ago}"
        f"^ORstateIN1,2,3"       # Include all open tickets regardless of date
        f"^short_descriptionLIKECRITICAL^ORshort_descriptionLIKEHIGH"
        f"^ORshort_descriptionLIKEMEDIUM^ORshort_descriptionLIKELOW"
    )

    # Alternative simpler query if you have a custom field linking to Wiz:
    # query = f"u_source_tool=Wiz^sys_created_on>={six_months_ago}"

    all_tickets = []
    offset = 0
    limit = 1000   # Fetch 1000 at a time

    while True:
        response = requests.get(
            base_url,
            auth=(Config.SNOW_USERNAME, Config.SNOW_PASSWORD),
            headers={"Accept": "application/json"},
            params={
                "sysparm_query": query,
                "sysparm_fields": (
                    "number,"          # ticket_id (e.g., INC0012345)
                    "u_finding_id,"    # custom field linking to Wiz finding ID
                    "short_description,"
                    "priority,"
                    "state,"
                    "assignment_group.name,"
                    "assigned_to.name,"
                    "sys_created_on,"
                    "resolved_at,"
                    "u_sla_target_date,"
                    "u_sla_status,"
                    "close_notes,"
                    "u_change_request"
                ),
                "sysparm_limit": limit,
                "sysparm_offset": offset,
                "sysparm_display_value": "true",
            },
        )
        response.raise_for_status()
        data = response.json()["result"]

        if not data:
            break   # No more records

        all_tickets.extend(data)
        logger.info(f"  Fetched {len(data)} tickets (offset {offset})")

        if len(data) < limit:
            break   # Last page

        offset += limit

    logger.info(f"✅ Fetched {len(all_tickets)} total ServiceNow tickets")
    return all_tickets


def transform_snow_tickets(raw_tickets):
    """
    Step 2: Transform ServiceNow JSON into flat DataFrame.

    WHY TRANSFORM: ServiceNow returns fields differently based on
    sysparm_display_value setting. We normalize everything to
    consistent column names matching our SQL schema.
    """
    records = []

    # ServiceNow state codes → readable status
    state_map = {
        "1": "Open", "New": "Open",
        "2": "In Progress", "In Progress": "In Progress",
        "3": "On Hold", "On Hold": "On Hold",
        "6": "Resolved", "Resolved": "Closed",
        "7": "Closed", "Closed": "Closed",
    }

    # ServiceNow priority codes → P1/P2/P3/P4
    priority_map = {
        "1": "P1", "1 - Critical": "P1",
        "2": "P2", "2 - High": "P2",
        "3": "P3", "3 - Moderate": "P3",
        "4": "P4", "4 - Low": "P4",
    }

    for t in raw_tickets:
        status = state_map.get(str(t.get("state", "")), t.get("state", "Open"))
        priority = priority_map.get(str(t.get("priority", "")), t.get("priority", "P3"))

        # Calculate SLA status if not provided by ServiceNow
        sla_status = t.get("u_sla_status", "")
        if not sla_status and t.get("u_sla_target_date"):
            target = pd.to_datetime(t["u_sla_target_date"])
            if status in ("Closed", "Resolved"):
                resolved = pd.to_datetime(t.get("resolved_at", ""))
                sla_status = "Met" if resolved <= target else "Missed"
            else:
                now = pd.Timestamp.now()
                remaining_pct = (target - now) / (target - pd.to_datetime(t["sys_created_on"]))
                if now > target:
                    sla_status = "Breached"
                elif remaining_pct < 0.25:
                    sla_status = "At Risk"
                else:
                    sla_status = "On Track"

        records.append({
            "ticket_id": t.get("number", ""),
            "finding_id": t.get("u_finding_id", ""),
            "short_description": t.get("short_description", ""),
            "priority": priority,
            "status": status,
            "assignment_group": t.get("assignment_group.name",
                                      t.get("assignment_group", {}).get("display_value", "")),
            "assigned_to": t.get("assigned_to.name",
                                  t.get("assigned_to", {}).get("display_value", "")),
            "created_date": (t.get("sys_created_on", "") or "")[:10] or None,
            "resolved_date": (t.get("resolved_at", "") or "")[:10] or None,
            "sla_target_date": (t.get("u_sla_target_date", "") or "")[:10] or None,
            "sla_status": sla_status,
            "resolution_notes": t.get("close_notes", ""),
            "change_request_id": t.get("u_change_request", ""),
        })

    df = pd.DataFrame(records)
    logger.info(f"✅ Transformed {len(df)} tickets into DataFrame")
    return df


def load_snow_tickets(df):
    """Step 3: Full-refresh load into dashboard warehouse."""
    engine = create_engine(Config.get_warehouse_connection_string())

    with engine.connect() as conn:
        conn.execute("TRUNCATE TABLE dashboard.servicenow_tickets")
        conn.commit()

    df.to_sql(
        name="servicenow_tickets",
        schema="dashboard",
        con=engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=500,
    )
    logger.info(f"✅ Loaded {len(df)} tickets into dashboard warehouse")
    return len(df)


def run():
    """Main entry point."""
    start = datetime.now()
    try:
        raw = fetch_snow_tickets()
        df = transform_snow_tickets(raw)
        rows = load_snow_tickets(df)
        return {"status": "success", "rows": rows,
                "start": start, "end": datetime.now()}
    except Exception as e:
        logger.error(f"❌ ServiceNow extraction failed: {e}")
        return {"status": "failed", "rows": 0,
                "start": start, "end": datetime.now(), "error": str(e)}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = run()
    print(result)
```

---

# PART 5: PIPELINE ORCHESTRATOR

## `run_pipeline.py`

```python
"""
run_pipeline.py — Daily pipeline orchestrator.
Runs all 3 extractors, logs results, sends alert on failure.

USAGE:
  python run_pipeline.py            # Run full pipeline
  python run_pipeline.py --wiz      # Run Wiz only
  python run_pipeline.py --snow     # Run ServiceNow only
  python run_pipeline.py --cmdb     # Run CMDB only

SCHEDULING:
  Windows Task Scheduler: runs this script at 6:00 AM daily
  Linux: crontab -e → 0 6 * * * cd /opt/SecurityDashboard && python run_pipeline.py
"""

import sys
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from config import Config

import extract_wiz
import extract_cmdb
import extract_snow

# ── Logging Setup ────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("logs/pipeline.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("pipeline")


def log_to_db(source, result):
    """Write pipeline execution results to the refresh_log table."""
    engine = create_engine(Config.get_warehouse_connection_string())
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO dashboard.refresh_log
                (source, status, rows_processed, start_time, end_time, error_message)
            VALUES
                (:source, :status, :rows, :start, :end, :error)
        """), {
            "source": source,
            "status": result["status"],
            "rows": result.get("rows", 0),
            "start": result["start"],
            "end": result["end"],
            "error": result.get("error"),
        })
        conn.commit()


def send_alert(source, error):
    """
    Send failure alert via email or Teams webhook.

    In production, use one of these:
    - Microsoft Teams webhook (HTTP POST with JSON)
    - SMTP email via smtplib
    - PagerDuty / Opsgenie API
    """
    logger.critical(f"🚨 PIPELINE FAILURE: {source} — {error}")

    # Example: Teams webhook notification
    # import requests
    # webhook_url = "https://outlook.office.com/webhook/xxx/IncomingWebhook/yyy"
    # payload = {
    #     "title": f"🚨 Security Dashboard Pipeline Failed: {source}",
    #     "text": f"Error: {error}\nTime: {datetime.now()}\nAction: Check logs at C:\\SecurityDashboard\\logs\\pipeline.log",
    #     "themeColor": "FF0000",
    # }
    # requests.post(webhook_url, json=payload)


def run_full_pipeline():
    """Execute all 3 extractors in sequence."""
    pipeline_start = datetime.now()
    logger.info("=" * 60)
    logger.info(f"🚀 PIPELINE STARTED at {pipeline_start}")
    logger.info("=" * 60)

    results = {}

    # ── Step 1: Extract Wiz Findings ───────────────────────
    logger.info("\n📡 [1/3] Extracting Wiz findings...")
    result = extract_wiz.run()
    results["wiz"] = result
    log_to_db("wiz", result)
    if result["status"] == "failed":
        send_alert("Wiz", result.get("error", "Unknown"))

    # ── Step 2: Extract CMDB Assets ────────────────────────
    logger.info("\n🗄️ [2/3] Extracting CMDB assets...")
    result = extract_cmdb.run()
    results["cmdb"] = result
    log_to_db("cmdb", result)
    if result["status"] == "failed":
        send_alert("CMDB", result.get("error", "Unknown"))

    # ── Step 3: Extract ServiceNow Tickets ─────────────────
    logger.info("\n🎫 [3/3] Extracting ServiceNow tickets...")
    result = extract_snow.run()
    results["snow"] = result
    log_to_db("servicenow", result)
    if result["status"] == "failed":
        send_alert("ServiceNow", result.get("error", "Unknown"))

    # ── Summary ────────────────────────────────────────────
    pipeline_end = datetime.now()
    duration = (pipeline_end - pipeline_start).total_seconds()

    logger.info("\n" + "=" * 60)
    logger.info(f"📊 PIPELINE COMPLETED in {duration:.0f} seconds")
    for source, r in results.items():
        status_icon = "✅" if r["status"] == "success" else "❌"
        logger.info(f"   {status_icon} {source}: {r['status']} ({r.get('rows', 0)} rows)")
    logger.info("=" * 60)

    return results


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--wiz" in args:
        result = extract_wiz.run()
        log_to_db("wiz", result)
    elif "--cmdb" in args:
        result = extract_cmdb.run()
        log_to_db("cmdb", result)
    elif "--snow" in args:
        result = extract_snow.run()
        log_to_db("servicenow", result)
    else:
        run_full_pipeline()
```

---

# PART 6: SCHEDULING — Automate Daily Runs

## Option A: Windows Task Scheduler

```
Step 1: Open Task Scheduler → Create Task

Step 2: General Tab
   Name: SecurityDashboard_DailyRefresh
   Description: Daily extraction from Wiz, CMDB, ServiceNow
   Run whether user is logged on or not: YES
   Run with highest privileges: YES

Step 3: Triggers Tab
   New → Daily
   Start: 6:00 AM
   Recur every: 1 day
   Enabled: YES

Step 4: Actions Tab
   New → Start a Program
   Program: C:\SecurityDashboard\venv\Scripts\python.exe
   Arguments: run_pipeline.py
   Start in: C:\SecurityDashboard

Step 5: Conditions Tab
   Wake the computer to run this task: YES
   Start only if network is available: YES

Step 6: OK → Enter service account password
```

## Option B: Azure Function (Serverless)

```python
# function_app.py — Azure Function Timer Trigger
# Runs as serverless function — no VM needed

import azure.functions as func
import datetime
import logging

app = func.FunctionApp()

@app.timer_trigger(schedule="0 0 6 * * *",   # 6:00 AM UTC daily
                   arg_name="timer",
                   run_on_startup=False)
def daily_security_refresh(timer: func.TimerRequest):
    """Azure Function that runs the pipeline daily."""
    logging.info(f"Pipeline triggered at {datetime.datetime.now()}")

    # Import and run the pipeline
    from run_pipeline import run_full_pipeline
    results = run_full_pipeline()

    logging.info(f"Pipeline completed: {results}")
```

## Option C: Linux Cron

```bash
# crontab -e
# Run at 6:00 AM UTC every day
0 6 * * * cd /opt/SecurityDashboard && /opt/SecurityDashboard/venv/bin/python run_pipeline.py >> /opt/SecurityDashboard/logs/cron.log 2>&1
```

---

# PART 7: POWER BI CONNECTION — SQL Server

## Step 1: Connect Power BI to the Data Warehouse

```
1. Power BI Desktop → Home → Get Data → SQL Server

2. Server: your-sql-server.database.windows.net
   Database: security_dashboard
   Data Connectivity Mode: Import
   ↑ WHY Import (not DirectQuery):
     - Faster dashboard performance (data cached locally)
     - No live query load on SQL Server during presentations
     - Scheduled refresh updates the cache daily

3. Advanced Options:
   SQL Statement (paste this for the Findings table):

   SELECT
       f.*,
       a.ci_name,
       a.owner,
       a.owner_email,
       a.assignment_group AS asset_assignment_group,
       a.environment,
       a.application,
       a.business_unit,
       a.data_classification AS asset_data_classification,
       a.manager,
       t.ticket_id,
       t.priority AS ticket_priority,
       t.status AS ticket_status,
       t.sla_status,
       t.sla_target_date,
       t.resolved_date,
       t.resolution_notes,
       t.change_request_id,
       DATEDIFF(day, f.created_date, ISNULL(f.closed_date, GETDATE())) AS days_open,
       CASE
           WHEN f.severity = 'CRITICAL' THEN 10
           WHEN f.severity = 'HIGH' THEN 5
           WHEN f.severity = 'MEDIUM' THEN 2
           ELSE 1
       END AS risk_score
   FROM dashboard.wiz_findings f
   LEFT JOIN dashboard.cmdb_assets a
       ON f.resource_id = a.cloud_resource_id
   LEFT JOIN dashboard.servicenow_tickets t
       ON f.finding_id = t.finding_id

4. Click OK → Load
   This gives you ONE enriched table with all 3 data sources joined.
```

## Step 2: Set Up Scheduled Refresh (Power BI Service)

```
1. Publish your .pbix file to Power BI Service:
   Home → Publish → Select your workspace

2. In Power BI Service (app.powerbi.com):
   a. Go to Settings → Datasets → your dataset
   b. Gateway Connection:
      - If data is in Azure SQL: No gateway needed ✅
      - If data is on-prem SQL: Install Power BI Gateway

3. Scheduled Refresh:
   a. Turn ON scheduled refresh
   b. Refresh frequency: Daily
   c. Time zone: Your local time zone
   d. Time: 7:00 AM (1 hour after Python pipeline finishes)
      WHY 7 AM: Python pipeline runs at 6 AM, takes ~10 minutes.
      Power BI refreshes at 7 AM = always fresh data.

   e. Failure notifications: ENABLED → send to your email
      WHY: If refresh fails, you want to know before the CEO opens the dashboard

4. Row-Level Security (RLS) — OPTIONAL:
   If different leaders should see different data:
   a. Modeling → Manage Roles
   b. Create role "Capital Markets" with filter:
      [business_unit] = "Capital Markets"
   c. Assign users to roles in Power BI Service:
      Workspace → Security → Add members to roles
```

## Step 3: Monthly Report Distribution

```
1. Power BI Service → Your Dashboard
2. Subscribe:
   - Click "Subscribe to report"
   - Add CEO, CISO email addresses
   - Frequency: Monthly (1st of each month, 9:00 AM)
   - Include: Screenshot + link to live dashboard
   - Subject: "Monthly Security Posture Report — [Month Year]"

3. Export for Board Meetings:
   - File → Export → PowerPoint (best for board presentations)
   - File → Export → PDF (for email attachments)

4. Teams Integration:
   - Pin the Power BI dashboard tab in your Security team's channel
   - Anyone in the channel sees the live dashboard
```

---

# PART 8: COMPLETE WORKFLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     DAILY AUTOMATED WORKFLOW                              │
│                                                                          │
│  6:00 AM ─── Python Pipeline Starts ──────────────────────────────────  │
│              │                                                           │
│              ├── extract_wiz.py                                          │
│              │   1. OAuth token from Wiz auth endpoint                   │
│              │   2. GraphQL query (paginated, 500/page)                  │
│              │   3. Transform nested JSON → flat DataFrame               │
│              │   4. TRUNCATE + INSERT into dashboard.wiz_findings        │
│              │                                                           │
│              ├── extract_cmdb.py                                         │
│              │   1. SQL query to CMDB database (read-only)               │
│              │   2. Copy relevant cloud assets only                      │
│              │   3. TRUNCATE + INSERT into dashboard.cmdb_assets         │
│              │                                                           │
│              ├── extract_snow.py                                         │
│              │   1. REST API GET to ServiceNow Table API                 │
│              │   2. Paginate (sysparm_offset, 1000/page)                 │
│              │   3. Map state codes to readable statuses                 │
│              │   4. TRUNCATE + INSERT into dashboard.servicenow_tickets  │
│              │                                                           │
│              └── Log results to dashboard.refresh_log                    │
│                  Alert on failure via Teams webhook / email              │
│                                                                          │
│  6:10 AM ─── Pipeline Complete ───────────────────────────────────────  │
│                                                                          │
│  7:00 AM ─── Power BI Scheduled Refresh ──────────────────────────────  │
│              │                                                           │
│              ├── Connects to SQL Server (Azure SQL / Gateway)            │
│              ├── Runs the enriched JOIN query (Part 7, Step 1)           │
│              ├── Refreshes all 20 DAX measures                           │
│              └── Dashboard is live with today's data ✅                  │
│                                                                          │
│  7:05 AM ─── CISO opens dashboard = today's data ─────────────────────  │
│                                                                          │
│  Monthly ─── Auto-email to CEO + CISO with PDF snapshot ──────────────  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# PART 9: INTERVIEW TALKING POINTS

### Q: "How do you automate security reporting?"

> "I built a Python ETL pipeline that runs daily at 6 AM. It pulls findings from Wiz via GraphQL API, enriches them with asset ownership from the CMDB SQL database, and links to remediation tickets from ServiceNow's Table API. Everything lands in a central SQL Server warehouse. Power BI connects to this warehouse with scheduled refresh at 7 AM, so the dashboard is always showing today's data when the CISO opens it. I also set up monthly email subscriptions to send the CEO a PDF snapshot on the 1st of each month."

### Q: "Why not connect Power BI directly to Wiz/ServiceNow APIs?"

> "Three reasons. **First**, Power BI's web connector has limited support for GraphQL and OAuth2 — Wiz uses both. Python handles this cleanly. **Second**, performance — a Power BI refresh that makes 200 API calls takes 15 minutes; pre-loading into SQL takes 2 minutes. **Third**, reliability — if the Wiz API is slow or ServiceNow has maintenance, the Python pipeline retries and logs the failure. Power BI would just show a blank dashboard with an error message. The SQL warehouse acts as a buffer between fragile APIs and executive-facing dashboards."

### Q: "How do you handle API failures?"

> "The pipeline has three safety nets. **First**, each extractor is independent — if ServiceNow fails, Wiz and CMDB data still refresh. **Second**, failures are logged to a `refresh_log` table, so I can see exactly when and why something failed. **Third**, an alert fires via Teams webhook to the security operations channel. We don't use TRUNCATE-then-fail — if the extract fails, the previous day's data stays in the table until the next successful run."

### Q: "Walk me through the data flow for a single finding."

> "A misconfiguration is detected by Wiz — say, an S3 bucket with public access. Wiz creates an Issue with severity CRITICAL. My pipeline picks it up at 6 AM via GraphQL, writes it to `dashboard.wiz_findings`. The JOIN enriches it with the CMDB owner (Rajesh Kumar, Platform Engineering team). Meanwhile, our Wiz-to-ServiceNow integration auto-creates a P1 ticket in ServiceNow, which my pipeline pulls into `servicenow_tickets`. Power BI shows all three dimensions — the finding severity, the asset owner, and the ticket SLA status — in one unified view. The CISO can click on Rajesh's name and see every finding assigned to him with SLA status."

---

# PART 10: SECURITY CONSIDERATIONS

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔒 SECURITY CHECKLIST FOR THE PIPELINE                              │
│                                                                      │
│  ✅ API credentials stored in .env file (never in code)              │
│  ✅ .env file added to .gitignore                                    │
│  ✅ Service accounts have READ-ONLY access (no write to source)      │
│  ✅ SQL warehouse user has INSERT/TRUNCATE on dashboard schema only   │
│  ✅ CMDB query is SELECT-only (no INSERT/UPDATE/DELETE)               │
│  ✅ Wiz service account scope: "read:issues" only                    │
│  ✅ ServiceNow API user has "itil_reader" role only                   │
│  ✅ Pipeline logs do NOT contain credentials                          │
│  ✅ Power BI RLS restricts who sees what data                         │
│  ✅ Scheduled refresh uses encrypted credentials in PBI Service       │
│                                                                      │
│  ❌ NEVER DO:                                                        │
│  ❌ Hardcode passwords in Python scripts                              │
│  ❌ Give pipeline user admin access to CMDB                           │
│  ❌ Connect Power BI directly to production CMDB                      │
│  ❌ Store .env in git repository                                      │
│  ❌ Use personal accounts for scheduled tasks                         │
└──────────────────────────────────────────────────────────────────────┘
```
