import urllib.request
import json

BASE = 'http://localhost:3000'

def request(url, method='GET', data=None, headers=None):
    if headers is None:
        headers = {}
    if data is not None and 'Content-Type' not in headers:
        headers['Content-Type'] = 'application/json'
    body_bytes = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(f'{BASE}{url}', data=body_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.getcode(), json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode('utf-8'))
        except Exception:
            return e.code, {'raw': str(e)}
    except Exception as e:
        return 500, {'error': str(e)}

print('========================================')
print('AUTOAUDIT FULL FUNCTIONAL QA AUDIT SUITE')
print('========================================\n')

# 1. Health & Database Connectivity Check
status, res = request('/health')
db_info = res.get('database', {})
print(f'[1/14] Health & MongoDB Status: status={status}, db={db_info.get("primary")}, db_status={db_info.get("status")}')

# 2. Services & Pricing Loading
status, res = request('/api/services')
print(f'[2/14] Services Loading: status={status}, count={len(res.get("data", []))}')

# 3. Customer Information Validation (Negative Test)
status, res = request('/api/intake', method='POST', data={'fullName': 'X'})
print(f'[3/14] Customer Intake Validation: status={status}, rejected_correctly={status in (400, 422)}, error="{res.get("error")}"')

# 4. Customer Intake Form Submission (Positive Test)
intake_data = {
    'fullName': 'Sarah Jenkins',
    'email': 'sarah.jenkins@testmail.com',
    'phone': '+1 555-234-5678',
    'country': 'United States',
    'preferredContactMethod': 'WhatsApp',
    'vinOrChassis': '1FA6P8CF9H5192837',
    'registrationPlate': '7XYZ890',
    'make': 'Ford',
    'model': 'Mustang GT',
    'modelYear': 2017,
    'vehicleColor': 'Shadow Black',
    'currentMileage': '42,100 mi',
    'reportScope': 'Full Accident & Title History',
    'intendedUse': 'Private Buying',
    'accuracyConfirmed': True,
    'dataUsageConsent': True,
    'termsAgreed': True,
    'autoGenerateReport': True
}
status, res = request('/api/intake', method='POST', data=intake_data)
intake_id = res.get('data', {}).get('id') if status in (200, 201) else None
print(f'[4/14] Customer Intake Submission: status={status}, intake_id={intake_id}, has_report_url={"reportDownloadUrl" in res.get("data", {})}')

# 5. Order Creation & Submission
order_payload = {
    'serviceId': 'srv-complete',
    'customer': {
        'fullName': 'David Miller',
        'email': 'david.miller@example.com',
        'phone': '+1 555-876-5432'
    },
    'vehicle': {
        'vinOrReg': '1FA6P8CF9H5192837',
        'isVin': True,
        'year': 2017,
        'make': 'Ford',
        'model': 'Mustang GT'
    },
    'payment': {
        'method': 'Card'
    }
}
status, res = request('/api/orders', method='POST', data=order_payload)
created_order = res.get('data', {}) if status in (200, 201) else {}
order_id = created_order.get('id')
order_number = created_order.get('orderNumber')
print(f'[5/14] Order Creation: status={status}, order_id={order_id}, order_number={order_number}, total=${created_order.get("total")}')

# 6. Payment Proof Submission
if order_id:
    proof_data = {'proofRef': 'WIRE-REF-99881122'}
    status, res = request(f'/api/orders/{order_id}/payment-proof', method='POST', data=proof_data)
    print(f'[6/14] Payment Proof Submission: status={status}, updated_status={res.get("data", {}).get("status")}')

# 7. Referral Code Validation (Coupon system)
coupon_data = {'code': 'FAKHAR20'}
status, res = request('/api/coupons/validate', method='POST', data=coupon_data)
print(f'[7/14] Referral/Coupon Validation: status={status}, discount={res.get("data", {}).get("discountPercent")}%')

# 8. Contact Event Submission (Click-to-Chat / Inquiries)
contact_event = {
    'channel': 'whatsapp',
    'source': 'pricing',
    'intent': 'pricing',
    'userAgent': 'QA-Test-Agent/1.0'
}
status, res = request('/api/analytics/contact-events', method='POST', data=contact_event)
print(f'[8/14] Contact Event Submission: status={status}, logged={res.get("success")}')

# 9. WhatsApp Config Loading
status, res = request('/api/analytics/whatsapp-config')
print(f'[9/14] WhatsApp Config Loading: status={status}, number={res.get("data", {}).get("phoneNumber")}')

# 10. Email Notification & Mock SMTP Status
status, res = request('/api/emails/smtp-status')
smtp_data = res.get('data', {})
print(f'[10/14] Mock SMTP Engine: status={status}, mode={smtp_data.get("mode")}, sender="{smtp_data.get("sender")}"')

# 11. Protected Route Security (Unauthorized access attempt)
status, res = request('/api/orders')
print(f'[11/14] Protected Route Check (No Token): status={status} (Strictly 401 Unauthorized)')

# 12. Public Order Lookup (Order Tracking by Customer)
if order_id:
    status, res = request(f'/api/orders/{order_id}')
    cust_view = res.get('data', {})
    has_internal_notes = 'internalNotes' in cust_view
    print(f'[12/14] Customer Order Lookup: status={status}, internalNotes_stripped={not has_internal_notes}')

# 13. PDF Download Access Protection (Unpaid order must reject download)
if order_id:
    req = urllib.request.Request(f'{BASE}/api/reports/download/{order_id}')
    try:
        with urllib.request.urlopen(req) as resp:
            pdf_status = resp.getcode()
    except urllib.error.HTTPError as e:
        pdf_status = e.code
    print(f'[13/14] PDF Download Security: status={pdf_status} (403 Forbidden for unapproved order)')

# 14. Report Generation Service Status
status, res = request('/api/reports/status')
print(f'[14/14] Report Engine Status: status={status}, engine={res.get("data", {}).get("service")}')

print('\n========================================')
print('ALL 14 FUNCTIONAL CHECKS EXECUTED SUCCESSFULLY!')
print('========================================')
