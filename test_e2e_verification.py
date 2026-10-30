import requests
import json
import sys

base_url = 'http://127.0.0.1:8000'

print('=== 1. Testing Assistant with Paracetamol Query ===')
payload1 = {
    'phc_id': 'phc-01',
    'query': 'Can I get Paracetamol in our zone?'
}
res1 = requests.post(f'{base_url}/api/assistant/chat', json=payload1).json()
struct1 = res1.get('structured', {})

print('Detected medicine:', res1.get('detected_medicine'))
print('Status:', struct1.get('status'))
print('Situation:', struct1.get('situation'))
print('Recommendation:', struct1.get('recommendation'))
print('Why items:', len(struct1.get('why', [])))
print('Cross-zone count:', len(struct1.get('cross_zone_options', [])))
print('Same-zone count:', len(struct1.get('same_zone_options', [])))

# Verify no Cefixime in Paracetamol response
full_text = json.dumps(res1).lower()
assert 'paracetamol' in full_text, 'Paracetamol must be present'
assert 'cefixime' not in full_text, 'Cefixime must NOT appear in Paracetamol response'
assert struct1.get('situation'), 'Situation must be present'
assert struct1.get('recommendation'), 'Recommendation must be present'
assert len(struct1.get('why', [])) >= 2, 'Why must have 2-4 items'
print('>>> Paracetamol test PASSED: 0 Cefixime mentions, strictly Paracetamol, structured output valid.')

print('\n=== 2. Testing Query Without Medicine ===')
payload2 = {
    'phc_id': 'phc-01',
    'query': 'Can you help me check our status?'
}
res2 = requests.post(f'{base_url}/api/assistant/chat', json=payload2).json()
struct2 = res2.get('structured', {})
print('Status:', struct2.get('status'))
print('Reply:', res2.get('reply'))
assert struct2.get('status') == 'INPUT_REQUIRED', 'Should request clarification'
print('>>> Clarification test PASSED: correctly asks for medicine name.')

print('\n=== 3. Testing Assistant with Cefixime Query ===')
payload3 = {
    'phc_id': 'phc-01',
    'query': 'Check Cefixime stock and alternatives'
}
res3 = requests.post(f'{base_url}/api/assistant/chat', json=payload3).json()
struct3 = res3.get('structured', {})
print('Detected medicine:', res3.get('detected_medicine'))
print('Situation:', struct3.get('situation'))
print('Recommendation:', struct3.get('recommendation'))
assert res3.get('detected_medicine') == 'Cefixime 200mg', 'Detected medicine should be Cefixime 200mg'
assert 'paracetamol' not in json.dumps(res3).lower(), 'Paracetamol must not appear in Cefixime response'
print('>>> Cefixime test PASSED.')

print('\n=== 4. Testing TinyFish Investigation Directly ===')
payload4 = {
    'medicine_name': 'Paracetamol',
    'phc_id': 'phc-01'
}
res4 = requests.post(f'{base_url}/api/investigation/run', json=payload4).json()
evidence = res4.get('investigation', {}).get('evidence', [])
print('TinyFish returned evidence items:', len(evidence))
snippets = [e.get('evidence_snippet') for e in evidence]
print('Unique snippets:', len(set(snippets)), 'out of', len(snippets))
for e in evidence[:4]:
    snip = e.get('evidence_snippet', '')
    if len(snip) > 60:
        snip = snip[:60]
    print(f"- {e.get('source_name')} ({e.get('location')}): {snip}... | Price: {e.get('unit_cost_inr')}")
assert len(set(snippets)) == len(snippets), 'Evidence snippets must NOT be duplicated!'
assert res4.get('approval_id'), 'Approval ID should be generated for Health Administrator'
print(f">>> TinyFish test PASSED: 100% unique source-specific evidence. Generated approval: {res4.get('approval_id')}")

print('\n=== 5. Testing Health Admin Decision Review ===')
approval_id = res4.get('approval_id')
review_payload = {
    'decision': 'APPROVED',
    'reviewer_name': 'Dr. Bengaluru Health Administrator'
}
res5 = requests.post(f'{base_url}/api/approvals/{approval_id}/review', json=review_payload).json()
print('Review response:', res5)
assert res5.get('success') is True, 'Review must succeed'
assert res5.get('status') == 'APPROVED'
print('>>> Health Admin Review test PASSED.')

print('\n======================================================')
print('ALL INTEGRITY & WORKFLOW TESTS PASSED 100% SUCCESSFULLY!')
print('======================================================')
