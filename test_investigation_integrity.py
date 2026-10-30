import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

print('--- TEST TINYFISH INVESTIGATION: Paracetamol ---')
p_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/investigation/run',
    data=json.dumps({'phc_id': 'phc-01', 'medicine_name': 'Paracetamol', 'location': 'Bengaluru, Karnataka, India'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
p_res = json.loads(urllib.request.urlopen(p_req).read().decode('utf-8'))
assert p_res['success'] == True
assert 'Paracetamol' in p_res['investigation']['target_medicine']
assert 'Paracetamol' in p_res['recommendation']['ai_reasoning']
assert 'Cefixime' not in p_res['recommendation']['ai_reasoning']
print('✓ TinyFish Paracetamol Investigation: correctly targeted Paracetamol without Cefixime leak')
print('  Sources discovered:', p_res['investigation']['evidence_count'])
print('  Action Type:', p_res['recommendation']['action_type'])
print('  Quantity:', p_res['recommendation']['quantity_recommended'])

print('\n--- TEST TINYFISH INVESTIGATION: Cefixime ---')
c_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/investigation/run',
    data=json.dumps({'phc_id': 'phc-01', 'medicine_name': 'Cefixime', 'location': 'Bengaluru, Karnataka, India'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
c_res = json.loads(urllib.request.urlopen(c_req).read().decode('utf-8'))
assert c_res['success'] == True
assert 'Cefixime' in c_res['investigation']['target_medicine']
assert 'Cefixime' in c_res['recommendation']['ai_reasoning']
print('✓ TinyFish Cefixime Investigation: correctly targeted Cefixime')
print('  Sources discovered:', c_res['investigation']['evidence_count'])
print('  Action Type:', c_res['recommendation']['action_type'])

print('\n=============================================')
print('ALL INVESTIGATION INTEGRITY TESTS PASSED!')
print('=============================================')

