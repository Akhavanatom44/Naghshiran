"""Integration against a running LOCAL development server; creates test rows."""
import json, urllib.request, urllib.error, http.cookiejar, uuid, time, os
base = os.environ.get('TEST_BASE_URL', 'http://127.0.0.1:3000')
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def request(path, data=None):
    req = urllib.request.Request(base+path, data=json.dumps(data).encode() if data is not None else None, headers={'Content-Type':'application/json'})
    try:
        with opener.open(req) as res: return res.status, json.load(res)
    except urllib.error.HTTPError as e: return e.code,json.load(e)
suffix = str(int(time.time()))[-8:]
account = {'username':'api_'+suffix, 'password':'validpassword123', 'phone':'091'+suffix, 'fullName':'کاربر تست'}
assert request('/api/auth/register', account)[0] == 200
assert request('/api/auth/me')[1]['user']['username'] == account['username']
products = request('/api/products')[1]['products']
p = next(p for p in products if p['code'] == 212)
assert p['price'] == 1275000
payload = {'requestKey':str(uuid.uuid4()), 'expectedTotal':p['price'], 'items':[{'productId':p['id'],'quantity':1}], 'fullName':account['fullName'], 'phone':account['phone'], 'deliveryMethod':'pickup', 'address':None, 'receiptImage':'data:image/png;base64,aGVsbG8='}
status, order = request('/api/orders',payload)
assert status == 200, (status,order)
assert request('/api/orders',payload)[1]['orderId'] == order['orderId']
assert request('/api/orders', {**payload, 'fullName':'نام دیگر'})[0] == 409
assert request('/api/orders', {**payload, 'requestKey':str(uuid.uuid4()), 'expectedTotal':0})[0] == 409
p2 = next(p for p in request('/api/products')[1]['products'] if p['code']==212)
assert p2['stock'] == p['stock']-1
assert request('/api/orders/'+str(order['orderId']))[1]['order']['totalAmount'] == p['price']
assert request('/api/auth/logout', {})[0] == 200
assert request('/api/auth/login', {'username':account['username'].upper(), 'password':account['password']})[0] == 200
assert request('/api/auth/me')[1]['user']['username'] == account['username']
print('PASS: local D1 signup/session, discounted total, atomic reservation, request retry, conflict checks, logout/login')
