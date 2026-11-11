"""Validate research artifact consistency only; does not certify mountain routes."""
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent

def read(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))

plan = read("mountain-50-source-plan.json")["mountains"]
snapshot = read("registered-snapshot.json")
audit = read("existing-20-audit.json")
assert len(plan) == 50 and len({m["mountain"] for m in plan}) == 50
assert sum(m["group"] == "기존20" for m in plan) == 20
assert sum(m["group"] == "추가30" for m in plan) == 30
expected = {(m["name"], c["name"]) for m in snapshot for c in m["courses"]}
actual = {(a["mountain"], a["registered"]["name"]) for a in audit}
assert expected == actual and len(audit) == len(expected) == 28
for record in plan + audit:
    url = record.get("source_url")
    assert not url or (urlparse(url).scheme == "https" and urlparse(url).hostname)
for record in audit:
    assert record["approved_for_import"] is False
    assert record["findings"] and record["comparison_status"]
for record in plan:
    assert record["distance_km"] is None and record["duration_minutes"] is None
print("PASS: 50 mountains / 20 existing / 30 additional / 28 course audits; no application data approval")
