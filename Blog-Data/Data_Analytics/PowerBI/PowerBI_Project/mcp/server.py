from flask import Flask, jsonify, request
import csv
import os
from datetime import datetime
from pathlib import Path

app = Flask(__name__)

# Get the data folder path
DATA_FOLDER = Path(__file__).parent.parent / "data"

# ============================================
# METADATA SCHEMA (answers "what tables exist?")
# ============================================
@app.route("/mcp/model", methods=["GET"])
def get_model():
    """Returns the schema: tables, columns, types, relationships"""
    return jsonify({
        "id": "CNAPP",
        "name": "Cloud Security Posture Dashboard",
        "tables": [
            {
                "name": "Findings",
                "description": "Security findings from Wiz cloud scanning",
                "columns": [
                    {"name": "finding_id", "dataType": "string", "description": "Unique finding ID"},
                    {"name": "severity", "dataType": "string", "description": "CRITICAL, HIGH, MEDIUM, LOW"},
                    {"name": "status", "dataType": "string", "description": "Open or Closed"},
                    {"name": "created_date", "dataType": "date", "description": "When finding was discovered"},
                    {"name": "closed_date", "dataType": "date", "description": "When finding was closed (if closed)"},
                    {"name": "internet_facing", "dataType": "string", "description": "Yes/No"},
                    {"name": "resource_id", "dataType": "string", "description": "Cloud resource identifier"},
                    {"name": "category", "dataType": "string", "description": "Finding category (Network, IAM, Storage, etc)"},
                    {"name": "sla_hours", "dataType": "integer", "description": "SLA target hours for remediation"}
                ]
            },
            {
                "name": "Assets",
                "description": "Cloud assets (servers, databases, storage accounts)",
                "columns": [
                    {"name": "resource_id", "dataType": "string", "description": "Cloud resource ID"},
                    {"name": "asset_name", "dataType": "string", "description": "Human-readable asset name"},
                    {"name": "business_unit", "dataType": "string", "description": "Team that owns this asset"},
                    {"name": "environment", "dataType": "string", "description": "Prod, Staging, Dev"},
                    {"name": "owner", "dataType": "string", "description": "Person responsible for this asset"}
                ]
            },
            {
                "name": "Tickets",
                "description": "ServiceNow tickets for remediation",
                "columns": [
                    {"name": "ticket_id", "dataType": "string", "description": "ServiceNow ticket number"},
                    {"name": "finding_id", "dataType": "string", "description": "Links to Findings table"},
                    {"name": "sla_status", "dataType": "string", "description": "Met, Missed, On Track, Breached"},
                    {"name": "created_date", "dataType": "date", "description": "When ticket was opened"},
                    {"name": "resolved_date", "dataType": "date", "description": "When ticket was resolved"},
                    {"name": "assignment_group", "dataType": "string", "description": "Team assigned to fix"}
                ]
            }
        ],
        "relationships": [
            {"from": "Findings.resource_id", "to": "Assets.resource_id", "type": "Many-to-One"},
            {"from": "Findings.finding_id", "to": "Tickets.finding_id", "type": "One-to-One"}
        ]
    })

# ============================================
# DATA ENDPOINTS (answers "give me the actual data")
# ============================================

@app.route("/mcp/data/Findings", methods=["GET"])
def get_findings_data():
    """Load Findings table from CSV"""
    findings_path = DATA_FOLDER / "wiz_findings.csv"
    if not findings_path.exists():
        return jsonify({"error": f"File not found: {findings_path}"}), 404
    
    data = []
    with open(findings_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    
    return jsonify({"table": "Findings", "rowCount": len(data), "data": data[:100]})  # First 100 rows

@app.route("/mcp/data/Assets", methods=["GET"])
def get_assets_data():
    """Load Assets table from CSV"""
    assets_path = DATA_FOLDER / "cmdb_assets.csv"
    if not assets_path.exists():
        return jsonify({"error": f"File not found: {assets_path}"}), 404
    
    data = []
    with open(assets_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    
    return jsonify({"table": "Assets", "rowCount": len(data), "data": data[:100]})

@app.route("/mcp/data/Tickets", methods=["GET"])
def get_tickets_data():
    """Load Tickets table from CSV"""
    tickets_path = DATA_FOLDER / "servicenow_tickets.csv"
    if not tickets_path.exists():
        return jsonify({"error": f"File not found: {tickets_path}"}), 404
    
    data = []
    with open(tickets_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    
    return jsonify({"table": "Tickets", "rowCount": len(data), "data": data[:100]})

# ============================================
# HEALTH CHECK & REFRESH
# ============================================

@app.route("/mcp/health", methods=["GET"])
def health():
    """Check if MCP server is alive"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

@app.route("/mcp/refresh", methods=["POST"])
def refresh_data():
    """Trigger a data refresh (for Power BI scheduled refresh)"""
    return jsonify({
        "status": "refresh_started",
        "message": "Data refresh triggered. CSV files will be reloaded next query.",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    print("🚀 MCP Server starting...")
    print("📊 Endpoints:")
    print("   GET  http://localhost:5000/mcp/model")
    print("   GET  http://localhost:5000/mcp/data/Findings")
    print("   GET  http://localhost:5000/mcp/data/Assets")
    print("   GET  http://localhost:5000/mcp/data/Tickets")
    print("   GET  http://localhost:5000/mcp/health")
    print("   POST http://localhost:5000/mcp/refresh")
    print("\n💡 Tip: Keep this window open while using Power BI!")
    app.run(port=5000, debug=True)
