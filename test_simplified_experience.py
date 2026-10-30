import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("--- 1. Testing Search Escalation (Same Zone vs Cross-Zone) ---")
url = "http://127.0.0.1:8000/api/phcs/phc-01/nearby-medicines?medicine=Paracetamol&quantity=100"
res = json.loads(urllib.request.urlopen(url).read().decode('utf-8'))
assert "same_zone_results" in res, "Missing same_zone_results"
assert "other_zones_results" in res, "Missing other_zones_results"
assert "origin_stock" in res, "Missing origin_stock"

print(f"Origin PHC Stock: {res['origin_stock']['current_stock']} units")
print(f"Same Zone Facilities count: {len(res['same_zone_results'])}")
print(f"Other Zones Facilities count: {len(res['other_zones_results'])}")
print(f"Transferable Surplus in Zone: {res['transferable_surplus']} units")
print(f"Sufficient: {res['is_internal_stock_sufficient']}")

print("\n--- 2. Testing Short Structured AI Assistant Response (Paracetamol) ---")
chat_req = urllib.request.Request(
    "http://127.0.0.1:8000/api/assistant/chat",
    data=json.dumps({"phc_id": "phc-01", "query": "Can I get Paracetamol in our zone?"}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
chat_res = json.loads(urllib.request.urlopen(chat_req).read().decode("utf-8"))
assert "structured" in chat_res, "Missing structured response in assistant"
st = chat_res["structured"]
print("Structured Title:", st["title"])
print("Situation:", st["situation"])
print("Best Option:", st["best_option"]["phc_name"], f"({st['best_option']['surplus']} units surplus, {st['best_option']['distance_km']} km away)")
print("Network Options Count:", len(st["network_options"]))
print("External Option:", st["external_option"])
print("Recommendation:", st["recommendation"])
print("Urgency:", st["urgency"])

assert "Paracetamol" in st["title"]
assert "Cefixime" not in st["situation"], "Leak: Cefixime found in Paracetamol situation!"
assert "Cefixime" not in st["recommendation"], "Leak: Cefixime found in Paracetamol recommendation!"

print("\n--- 3. Testing Short Structured AI Assistant Response (Cefixime) ---")
c_chat_req = urllib.request.Request(
    "http://127.0.0.1:8000/api/assistant/chat",
    data=json.dumps({"phc_id": "phc-01", "query": "I need Cefixime 100 units."}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
c_chat_res = json.loads(urllib.request.urlopen(c_chat_req).read().decode("utf-8"))
c_st = c_chat_res["structured"]
print("Cefixime Situation:", c_st["situation"])
print("Cefixime Status:", c_st["status"])
print("Cefixime Recommendation:", c_st["recommendation"])
assert "Cefixime" in c_st["title"]
assert c_st["status"] == "INSUFFICIENT_INTERNAL_STOCK"

print("\n=======================================================")
print("ALL SIMPLIFIED EXPERIENCE VERIFICATION TESTS PASSED!")
print("=======================================================")

