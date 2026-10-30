import sys
import urllib.request
import json

sys.stdout.reconfigure(encoding='utf-8')

print('--- TEST 1: Paracetamol Pipeline ---')
p_search = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/phcs/phc-01/nearby-medicines?medicine=Paracetamol&quantity=100').read().decode('utf-8'))
assert 'Paracetamol' in p_search['medicine_name'], f"Wrong med: {p_search['medicine_name']}"
assert p_search['is_internal_stock_sufficient'] == True, 'Expected sufficient surplus for Paracetamol in Zone 1'
print(f"✓ Paracetamol search: internal stock sufficient = {p_search['is_internal_stock_sufficient']}, surplus = {p_search['transferable_surplus']} units")

p_chat = json.loads(urllib.request.urlopen(urllib.request.Request(
    'http://127.0.0.1:8000/api/assistant/chat',
    data=json.dumps({'phc_id': 'phc-01', 'query': 'Can I get Paracetamol in our zone?'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)).read().decode('utf-8'))
assert 'Paracetamol' in p_chat['reply'], 'Paracetamol not in assistant response'
assert 'Cefixime' not in p_chat['reply'], 'Cefixime erroneously appeared in Paracetamol assistant response'
print('✓ Assistant chat dynamically focused on Paracetamol with zero Cefixime leak')

print('\n--- TEST 2: Cefixime Pipeline ---')
c_search = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/phcs/phc-01/nearby-medicines?medicine=Cefixime&quantity=100').read().decode('utf-8'))
assert 'Cefixime' in c_search['medicine_name']
assert c_search['is_internal_stock_sufficient'] == False, 'Expected insufficient surplus for Cefixime'
print(f"✓ Cefixime search: correctly identified deficit (transferable surplus = {c_search['transferable_surplus']} units < 100)")

print('\n--- TEST 3: Amoxicillin Pipeline ---')
a_search = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/phcs/phc-01/nearby-medicines?medicine=Amoxicillin&quantity=100').read().decode('utf-8'))
assert 'Amoxicillin' in a_search['medicine_name']
print(f"✓ Amoxicillin search: {a_search['medicine_name']}, surplus = {a_search['transferable_surplus']} units")

print('\n--- TEST 4: Operational Events Formatting ---')
evs = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/events?limit=3').read().decode('utf-8'))
for e in evs:
    assert 'formatted_title' in e and e['formatted_title'], 'Missing formatted_title'
    assert 'formatted_summary' in e and e['formatted_summary'], 'Missing formatted_summary'
    assert 'formatted_time' in e and e['formatted_time'], 'Missing formatted_time'
    assert '{' not in e['formatted_summary'], f"Raw JSON found in summary: {e['formatted_summary']}"
print('✓ All operational events formatted into human-readable titles and summaries without raw JSON')

print('\n--- TEST 5: Admin AI Analysis Structured Object ---')
ai = json.loads(urllib.request.urlopen(urllib.request.Request(
    'http://127.0.0.1:8000/api/admin/ai-analysis',
    data=b'{}',
    headers={'Content-Type': 'application/json'}
)).read().decode('utf-8'))
assert 'structured' in ai, 'Missing structured object'
assert 'critical_findings' in ai['structured']
assert 'high_risk_medicines' in ai['structured']
assert 'bed_pressure_points' in ai['structured']
print('✓ Admin AI analysis returns structured payload for HTML cards and tables')

print('\n=============================================')
print('ALL 5 PIPELINE INTEGRITY TESTS PASSED!')
print('=============================================')

