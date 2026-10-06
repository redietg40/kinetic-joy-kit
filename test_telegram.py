import urllib.request
import json
token = '7891299946:AAFm4N6Ld4YJ_y9tLsw23lC90E2qgI1yJ9M'
try:
    req = urllib.request.Request(f'https://api.telegram.org/bot{token}/getUpdates')
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    if hasattr(e, 'read'):
        print(e.read().decode())
    else:
        print(e)
