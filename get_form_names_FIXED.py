import requests
import json

# Corrected script using the authentication method that was just proven to work.
KAJABI_API_KEY = 'dtBLENEaM6znzzLeioUzCym2'
KAJABI_API_SECRET = 'Hi88JTdUcFCBRBjnzjyDW79d'

FORM_IDS = [
    '2149013599', '2148453867', '2149059319', '2147713967',
    '2147835243', '2148166918', '2148561824', '2148439004'
]

def get_kajabi_token():
    url = "https://api.kajabi.com/v1/oauth/token"
    payload = {
        'grant_type': 'client_credentials',
        'client_id': KAJABI_API_KEY,
        'client_secret': KAJABI_API_SECRET
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        return response.json().get('access_token')
    else:
        print(f"Error getting Kajabi token: {response.text}")
        return None

def get_form_title(token, form_id):
    url = f"https://api.kajabi.com/v1/forms/{form_id}"
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        form_data = response.json().get('data', {})
        return form_data.get('attributes', {}).get('title')
    else:
        return f"Error fetching form {form_id}: Status {response.status_code}"

token = get_kajabi_token()
if token:
    print("Successfully authenticated. Fetching form titles...")
    for form_id in FORM_IDS:
        title = get_form_title(token, form_id)
        print(f"Form ID: {form_id}  ->  Title: {title}")
else:
    print("Failed to authenticate.")
