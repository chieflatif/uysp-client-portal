import requests
import json
import time
import sys
import os
from dotenv import load_dotenv

print("--- Script Starting ---")

# Load environment variables
load_dotenv()

# --- Credentials ---
AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
KAJABI_API_KEY = os.getenv('KAJABI_API_KEY')
KAJABI_API_SECRET = os.getenv('KAJABI_AI_SECRET')
BASE_ID = 'app4wIsBfpJTg7pWS'
LEADS_TABLE_ID = 'tblYUvhGADerbD8EO'
# --- End Credentials ---

print("Credentials loaded.")

AIRTABLE_HEADERS = {
    'Authorization': f'Bearer {AIRTABLE_API_KEY}',
    'Content-Type': 'application/json'
}

def get_kajabi_token():
    print("Attempting to get Kajabi auth token...")
    url = "https://api.kajabi.com/v1/oauth/token"
    payload = {
        'grant_type': 'client_credentials',
        'client_id': KAJABI_API_KEY,
        'client_secret': KAJABI_API_SECRET
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status() # Raise an exception for bad status codes
        print("Successfully authenticated with Kajabi.")
        return response.json().get('access_token')
    except requests.exceptions.RequestException as e:
        print(f"FATAL: Error getting Kajabi token: {e}")
        return None

def fetch_all_airtable_records(table_id, filter_formula):
    print(f"Fetching records from Airtable table {table_id}...")
    url = f'https://api.airtable.com/v0/{BASE_ID}/{table_id}'
    params = {'pageSize': 100, 'filterByFormula': filter_formula, 'fields[]': 'Email'}
    records = []
    offset = None
    try:
        while True:
            if offset:
                params['offset'] = offset
            response = requests.get(url, headers=AIRTABLE_HEADERS, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            records.extend(data.get('records', []))
            offset = data.get('offset')
            print(f"  ...fetched {len(data.get('records', []))} records, total so far: {len(records)}")
            if not offset:
                break
        print(f"Finished fetching. Total records: {len(records)}")
        return records
    except requests.exceptions.RequestException as e:
        print(f"FATAL: Error fetching from Airtable: {e}")
        return []

def get_kajabi_tags(token, email):
    url = f"https://api.kajabi.com/v1/contacts?filter[search]={email}&include=tags"
    headers = {'Authorization': f'Bearer {token}'}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        included = data.get('included', [])
        tags = [tag['attributes']['name'] for tag in included if tag.get('type') == 'contact_tags' and tag.get('attributes')]
        return ', '.join(tags)
    except requests.exceptions.RequestException as e:
        print(f"  - WARN: Could not fetch tags for {email}. Error: {e}")
        return None

def update_airtable_batch(records):
    url = f'https://api.airtable.com/v0/{BASE_ID}/{LEADS_TABLE_ID}'
    payload = {'records': records, 'typecast': True}
    try:
        response = requests.patch(url, headers=AIRTABLE_HEADERS, json=payload, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"  - FATAL: Failed to update batch. Error: {e}")
        return {'error': str(e)}

# --- Main Execution ---
kajabi_token = get_kajabi_token()
if not kajabi_token:
    print("\nFATAL ERROR: Could not get Kajabi token. Script cannot continue.")
    sys.exit(1)

leads_to_fix = fetch_all_airtable_records(LEADS_TABLE_ID, "{Kajabi Tags} = BLANK()")
if not leads_to_fix:
    print("\nNo leads found with blank Kajabi Tags. Nothing to do. Exiting.")
    sys.exit(0)

print(f"\nProcessing {len(leads_to_fix)} leads to fetch new tags...")
records_to_update = []
for i, lead in enumerate(leads_to_fix):
    email = lead.get('fields', {}).get('Email')
    if not email:
        print(f"  - WARN: Skipping record {lead.get('id')} with no email.")
        continue
    
    print(f"  - ({i+1}/{len(leads_to_fix)}) Fetching tags for {email}...")
    tags = get_kajabi_tags(kajabi_token, email)
    
    if tags is not None and tags.strip() != '':
        print(f"    - Found tags: {tags}")
        records_to_update.append({
            'id': lead['id'],
            'fields': {'Kajabi Tags': tags}
        })
    else:
        print(f"    - No tags found for {email}.")
    
    time.sleep(0.5) # Rate limit delay for Kajabi API

if not records_to_update:
    print("\nNo leads had tags to update. Exiting.")
    sys.exit(0)

print(f"\nPrepared {len(records_to_update)} updates. Starting batch updates to Airtable...")

batch_size = 10
for i in range(0, len(records_to_update), batch_size):
    batch = records_to_update[i:i + batch_size]
    print(f"Updating batch {i // batch_size + 1} of {(len(records_to_update) + batch_size - 1) // batch_size}...")
    result = update_airtable_batch(batch)
    print(f"  - Response: {json.dumps(result, indent=2)}")
    time.sleep(0.2) # Rate limit delay for Airtable API

print("\n--- All updates complete! ---")
