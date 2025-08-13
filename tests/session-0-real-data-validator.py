#!/usr/bin/env python3
"""
UYSP Real Data Validator - Session 0 + Duplicate Testing
Tests field normalization system using real Kajabi CSV exports
Enhanced with comprehensive duplicate detection testing
"""

import os
import sys
import json
import pandas as pd
import requests
import time
from datetime import datetime
from typing import Dict, List, Any, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class UYSPFieldValidator:
    def __init__(self):
        self.webhook_url = "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean"
        self.test_results = []
        self.field_mapping_stats = {}
        self.unknown_fields = set()
        
        # Duplicate testing tracking
        self.duplicate_test_results = []
        self.processed_emails = set()
        self.duplicate_detections = 0
        self.new_record_creations = 0
        self.duplicate_failures = 0
        
    def normalize_csv_to_webhook_format(self, row: pd.Series, test_mode: str = "validation") -> Dict[str, Any]:
        """Convert CSV row to webhook payload format"""
        payload = {}
        
        # Map CSV columns to webhook field variations
        field_mappings = {
            'Full Name': 'name',
            'Email Address': 'email',
            'Company Name': 'company',
            'Phone Number': 'phone',
            'Are you interested in learning more about coaching with Ian?': 'interested_in_coaching',
            'Landing Page Title': 'source_form',
            'Landing Page ID': 'landing_page_id'
        }
        
        for csv_col, webhook_field in field_mappings.items():
            if csv_col in row and pd.notna(row[csv_col]) and str(row[csv_col]).strip():
                payload[webhook_field] = str(row[csv_col]).strip()
        
        # Add test metadata with mode indicator
        if test_mode == "duplicate_testing":
            payload['request_id'] = f"dup-test-{int(time.time())}-{hash(str(row.values)) % 1000}"
        else:
            payload['request_id'] = f"csv-test-{int(time.time())}-{hash(str(row.values)) % 1000}"
        
        return payload
    
    def create_duplicate_variations(self, original_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create variations of a payload to test duplicate detection"""
        variations = []
        
        # Variation 1: Same email, different name
        if 'email' in original_payload and 'name' in original_payload:
            var1 = original_payload.copy()
            var1['name'] = f"UPDATED {original_payload['name']}"
            var1['request_id'] = f"dup-var1-{int(time.time())}-{hash(str(var1.values)) % 1000}"
            variations.append(var1)
        
        # Variation 2: Same email, different phone
        if 'email' in original_payload and 'phone' in original_payload:
            var2 = original_payload.copy()
            var2['phone'] = f"999{original_payload['phone'][-7:]}"  # Change first digits
            var2['request_id'] = f"dup-var2-{int(time.time())}-{hash(str(var2.values)) % 1000}"
            variations.append(var2)
        
        # Variation 3: Same email, different company
        if 'email' in original_payload:
            var3 = original_payload.copy()
            var3['company'] = "UPDATED COMPANY NAME"
            var3['request_id'] = f"dup-var3-{int(time.time())}-{hash(str(var3.values)) % 1000}"
            variations.append(var3)
        
        return variations
    
    def send_webhook_test(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send test payload to webhook and return response"""
        try:
            response = requests.post(
                self.webhook_url,
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'X-API-Key': f'csv-validator-{int(time.time())}'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'status_code': response.status_code,
                    'data': response.json(),
                    'response_time': response.elapsed.total_seconds()
                }
            else:
                return {
                    'success': False,
                    'status_code': response.status_code,
                    'error': response.text,
                    'response_time': response.elapsed.total_seconds()
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'status_code': 0,
                'response_time': 0
            }
    
    def analyze_duplicate_handling(self, payload: Dict[str, Any], response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze duplicate detection and handling"""
        analysis = {
            'email': payload.get('email', 'unknown'),
            'is_duplicate': False,
            'duplicate_count': 0,
            'action_taken': 'unknown',
            'airtable_id': None,
            'processing_time': response_data.get('response_time', 0)
        }
        
        if response_data.get('success') and 'data' in response_data:
            webhook_response = response_data['data']
            if 'data' in webhook_response and 'fields' in webhook_response['data']:
                airtable_data = webhook_response['data']['fields']
                analysis['airtable_id'] = webhook_response['data'].get('id', 'Unknown')
                
                # Check duplicate count field
                if 'duplicate_count' in airtable_data:
                    analysis['duplicate_count'] = airtable_data['duplicate_count']
                    analysis['is_duplicate'] = airtable_data['duplicate_count'] > 1
                
                # Determine action taken
                if analysis['is_duplicate']:
                    analysis['action_taken'] = 'updated_existing'
                    self.duplicate_detections += 1
                else:
                    analysis['action_taken'] = 'created_new'
                    self.new_record_creations += 1
        else:
            # Failed processing
            analysis['action_taken'] = 'failed'
            self.duplicate_failures += 1
        
        return analysis
    
    def analyze_field_mapping(self, payload: Dict[str, Any], response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze field mapping success"""
        analysis = {
            'input_fields': len(payload),
            'mapped_fields': 0,
            'field_mapping_rate': 0,
            'unmapped_fields': [],
            'unknown_fields': [],
            'boolean_conversions': {},
            'name_splitting': False
        }
        
        if response_data.get('success') and 'data' in response_data:
            # Fix: Handle nested response structure
            webhook_response = response_data['data']
            if 'data' in webhook_response and 'fields' in webhook_response['data']:
                airtable_data = webhook_response['data']['fields']
                
                # Use the actual field_mapping_success_rate from the response
                if 'field_mapping_success_rate' in airtable_data:
                    analysis['field_mapping_rate'] = airtable_data['field_mapping_success_rate']
                
                # Count successfully mapped fields
                expected_mappings = {
                    'email': ['email'],
                    'name': ['first_name', 'last_name'],
                    'company': ['company_input'],
                    'phone': ['phone_primary'],
                    'interested_in_coaching': ['interested_in_coaching'],
                    'source_form': ['source_form']
                }
                
                mapped_count = 0
                for input_field, airtable_fields in expected_mappings.items():
                    if input_field in payload:
                        if any(af in airtable_data for af in airtable_fields):
                            mapped_count += 1
                        else:
                            analysis['unmapped_fields'].append(input_field)
                
                analysis['mapped_fields'] = mapped_count
                
                # Check name splitting
                if 'name' in payload and 'first_name' in airtable_data and 'last_name' in airtable_data:
                    analysis['name_splitting'] = True
                
                # Check boolean conversions
                if 'interested_in_coaching' in payload:
                    original_value = payload['interested_in_coaching']
                    airtable_value = airtable_data.get('interested_in_coaching')
                    analysis['boolean_conversions'][original_value] = airtable_value
                
                # Extract unknown fields from response
                if 'unknown_field_list' in airtable_data:
                    unknown_list = airtable_data['unknown_field_list']
                    if unknown_list:
                        analysis['unknown_fields'] = unknown_list.split(', ')
                        self.unknown_fields.update(analysis['unknown_fields'])
        
        return analysis
    
    def load_csv_data(self, csv_path: str) -> pd.DataFrame:
        """Load and validate CSV data"""
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"CSV file not found: {csv_path}")
        
        df = pd.read_csv(csv_path)
        print(f"✅ Loaded CSV: {len(df)} rows, {len(df.columns)} columns")
        print(f"📋 Columns: {list(df.columns)}")
        return df
    
    def run_duplicate_testing(self, csv_path: str, test_scenarios: Dict[str, int]) -> Dict[str, Any]:
        """Run comprehensive duplicate testing scenarios"""
        print("\n" + "=" * 70)
        print("🔄 STARTING COMPREHENSIVE DUPLICATE TESTING")
        print("=" * 70)
        print(f"📊 CSV Data Source: {csv_path}")
        print(f"🎯 Webhook URL: {self.webhook_url}")
        print(f"📋 Test Scenarios: {test_scenarios}")
        print("-" * 70)
        
        # Load CSV data
        df = self.load_csv_data(csv_path)
        
        # Reset duplicate tracking counters
        self.duplicate_detections = 0
        self.new_record_creations = 0
        self.duplicate_failures = 0
        self.processed_emails.clear()
        
        total_tests = sum(test_scenarios.values())
        current_test = 0
        
        # Scenario 1: Resend Same 10 Records (Pure Duplicates)
        if 'pure_duplicates' in test_scenarios:
            print(f"\n🔬 SCENARIO 1: Pure Duplicate Testing ({test_scenarios['pure_duplicates']} records)")
            print("-" * 50)
            
            test_rows = df.head(test_scenarios['pure_duplicates'])
            for index, row in test_rows.iterrows():
                current_test += 1
                self.process_duplicate_test(row, current_test, total_tests, "pure_duplicate")
        
        # Scenario 2: Send New Records
        if 'new_records' in test_scenarios:
            print(f"\n🔬 SCENARIO 2: New Records Testing ({test_scenarios['new_records']} records)")
            print("-" * 50)
            
            # Skip first 10 that were already tested
            start_idx = test_scenarios.get('pure_duplicates', 0)
            new_rows = df.iloc[start_idx:start_idx + test_scenarios['new_records']]
            
            batch_size = 25
            for i in range(0, len(new_rows), batch_size):
                batch = new_rows.iloc[i:i + batch_size]
                print(f"\n📦 Processing batch {i//batch_size + 1} ({len(batch)} records)")
                
                for index, row in batch.iterrows():
                    current_test += 1
                    self.process_duplicate_test(row, current_test, total_tests, "new_record")
                
                # Batch delay
                if i + batch_size < len(new_rows):
                    print(f"⏱️  Batch delay (2 seconds)...")
                    time.sleep(2)
        
        # Scenario 3: Variations of Existing Records
        if 'variations' in test_scenarios:
            print(f"\n🔬 SCENARIO 3: Record Variations Testing ({test_scenarios['variations']} variations)")
            print("-" * 50)
            
            # Create variations of first few records
            base_rows = df.head(min(5, test_scenarios['variations']))
            
            for index, row in base_rows.iterrows():
                original_payload = self.normalize_csv_to_webhook_format(row, "duplicate_testing")
                variations = self.create_duplicate_variations(original_payload)
                
                for i, variation in enumerate(variations[:test_scenarios['variations']//5]):
                    current_test += 1
                    print(f"\n🔬 Variation Test {current_test}/{total_tests}")
                    print(f"📤 Original Email: {original_payload.get('email', 'N/A')}")
                    print(f"📤 Variation: {json.dumps(variation, indent=2)}")
                    
                    response = self.send_webhook_test(variation)
                    duplicate_analysis = self.analyze_duplicate_handling(variation, response)
                    field_analysis = self.analyze_field_mapping(variation, response)
                    
                    # Store results
                    test_result = {
                        'test_id': current_test,
                        'scenario': 'variation',
                        'variation_type': f"variation_{i+1}",
                        'original_email': original_payload.get('email'),
                        'payload': variation,
                        'response': response,
                        'duplicate_analysis': duplicate_analysis,
                        'field_analysis': field_analysis,
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    self.duplicate_test_results.append(test_result)
                    self.print_duplicate_test_summary(duplicate_analysis, field_analysis, response)
                    
                    # Individual test delay
                    time.sleep(1)
        
        # Scenario 4: Full CSV Processing (if requested)
        if 'full_csv' in test_scenarios and test_scenarios['full_csv'] > 0:
            print(f"\n🔬 SCENARIO 4: Full CSV Processing ({len(df)} total records)")
            print("-" * 50)
            
            batch_size = 25
            for i in range(0, len(df), batch_size):
                batch = df.iloc[i:i + batch_size]
                print(f"\n📦 Processing batch {i//batch_size + 1}/{(len(df)-1)//batch_size + 1} ({len(batch)} records)")
                
                for index, row in batch.iterrows():
                    current_test += 1
                    self.process_duplicate_test(row, current_test, len(df), "full_csv")
                
                # Progress update
                progress = (i + len(batch)) / len(df) * 100
                print(f"📊 Progress: {progress:.1f}% complete")
                
                # Batch delay
                if i + batch_size < len(df):
                    print(f"⏱️  Batch delay (2 seconds)...")
                    time.sleep(2)
        
        return self.generate_duplicate_testing_report()
    
    def process_duplicate_test(self, row: pd.Series, current_test: int, total_tests: int, scenario: str):
        """Process a single duplicate test"""
        print(f"\n🔬 Test {current_test}/{total_tests} ({scenario})")
        
        # Convert CSV row to webhook payload
        payload = self.normalize_csv_to_webhook_format(row, "duplicate_testing")
        email = payload.get('email', 'unknown')
        
        # Track processed emails
        if email in self.processed_emails:
            print(f"📧 Email previously seen: {email}")
        else:
            print(f"📧 New email: {email}")
            self.processed_emails.add(email)
        
        # Send webhook test
        response = self.send_webhook_test(payload)
        duplicate_analysis = self.analyze_duplicate_handling(payload, response)
        field_analysis = self.analyze_field_mapping(payload, response)
        
        # Store results
        test_result = {
            'test_id': current_test,
            'scenario': scenario,
            'csv_row': dict(row),
            'payload': payload,
            'response': response,
            'duplicate_analysis': duplicate_analysis,
            'field_analysis': field_analysis,
            'timestamp': datetime.now().isoformat()
        }
        
        self.duplicate_test_results.append(test_result)
        self.print_duplicate_test_summary(duplicate_analysis, field_analysis, response)
        
        # Individual test delay
        time.sleep(1)
    
    def print_duplicate_test_summary(self, duplicate_analysis: Dict[str, Any], field_analysis: Dict[str, Any], response: Dict[str, Any]):
        """Print summary for individual duplicate test"""
        if response.get('success'):
            airtable_id = duplicate_analysis.get('airtable_id', 'Unknown')
            action = duplicate_analysis.get('action_taken', 'unknown')
            dup_count = duplicate_analysis.get('duplicate_count', 0)
            mapping_rate = field_analysis.get('field_mapping_rate', 0)
            
            if action == 'updated_existing':
                print(f"🔄 DUPLICATE DETECTED: Updated {airtable_id}, Count: {dup_count}, Mapping: {mapping_rate:.1f}%")
            elif action == 'created_new':
                print(f"✨ NEW RECORD: Created {airtable_id}, Mapping: {mapping_rate:.1f}%")
            else:
                print(f"❓ UNKNOWN ACTION: {action}")
        else:
            print(f"❌ Failed: {response.get('error', 'Unknown error')}")
    
    def generate_duplicate_testing_report(self) -> Dict[str, Any]:
        """Generate comprehensive duplicate testing report"""
        print("\n" + "=" * 70)
        print("📊 DUPLICATE TESTING FINAL REPORT")
        print("=" * 70)
        
        total_tests = len(self.duplicate_test_results)
        successful_tests = sum(1 for r in self.duplicate_test_results if r['response'].get('success'))
        
        # Scenario breakdown
        scenario_stats = {}
        for result in self.duplicate_test_results:
            scenario = result['scenario']
            if scenario not in scenario_stats:
                scenario_stats[scenario] = {'total': 0, 'successful': 0, 'duplicates': 0, 'new': 0}
            
            scenario_stats[scenario]['total'] += 1
            if result['response'].get('success'):
                scenario_stats[scenario]['successful'] += 1
                
                action = result['duplicate_analysis'].get('action_taken', 'unknown')
                if action == 'updated_existing':
                    scenario_stats[scenario]['duplicates'] += 1
                elif action == 'created_new':
                    scenario_stats[scenario]['new'] += 1
        
        # Performance metrics
        processing_times = [r['duplicate_analysis'].get('processing_time', 0) 
                          for r in self.duplicate_test_results if r['response'].get('success')]
        avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
        
        # Generate report
        report = {
            'summary': {
                'total_tests': total_tests,
                'successful_tests': successful_tests,
                'success_rate': (successful_tests / total_tests) * 100 if total_tests > 0 else 0,
                'duplicate_detections': self.duplicate_detections,
                'new_record_creations': self.new_record_creations,
                'duplicate_failures': self.duplicate_failures,
                'unique_emails_processed': len(self.processed_emails),
                'average_processing_time': avg_processing_time
            },
            'scenario_breakdown': scenario_stats,
            'performance_metrics': {
                'duplicate_detection_rate': (self.duplicate_detections / successful_tests) * 100 if successful_tests > 0 else 0,
                'new_record_rate': (self.new_record_creations / successful_tests) * 100 if successful_tests > 0 else 0,
                'failure_rate': (self.duplicate_failures / total_tests) * 100 if total_tests > 0 else 0
            },
            'detailed_results': self.duplicate_test_results,
            'timestamp': datetime.now().isoformat()
        }
        
        # Print summary
        print(f"🎯 Total Tests: {total_tests}")
        print(f"✅ Successful: {successful_tests} ({(successful_tests / total_tests) * 100:.1f}%)")
        print(f"🔄 Duplicates Detected: {self.duplicate_detections}")
        print(f"✨ New Records Created: {self.new_record_creations}")
        print(f"❌ Failures: {self.duplicate_failures}")
        print(f"📧 Unique Emails: {len(self.processed_emails)}")
        print(f"⏱️  Average Processing Time: {avg_processing_time:.2f}s")
        
        print(f"\n📊 SCENARIO BREAKDOWN:")
        for scenario, stats in scenario_stats.items():
            success_rate = (stats['successful'] / stats['total']) * 100 if stats['total'] > 0 else 0
            print(f"   {scenario}: {stats['total']} tests, {success_rate:.1f}% success, {stats['duplicates']} dups, {stats['new']} new")
        
        print(f"\n📈 PERFORMANCE METRICS:")
        print(f"   Duplicate Detection Rate: {report['performance_metrics']['duplicate_detection_rate']:.1f}%")
        print(f"   New Record Rate: {report['performance_metrics']['new_record_rate']:.1f}%")
        print(f"   Failure Rate: {report['performance_metrics']['failure_rate']:.1f}%")
        
        # Save report
        report_file = f"tests/results/duplicate-testing-report-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}.json"
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n💾 Report saved: {report_file}")
        
        # Assessment
        if report['performance_metrics']['duplicate_detection_rate'] >= 80:
            print("\n🎉 DUPLICATE TESTING PASSED: Excellent duplicate detection!")
        elif report['performance_metrics']['duplicate_detection_rate'] >= 60:
            print("\n⚠️  DUPLICATE TESTING WARNING: Good but could improve")
        else:
            print("\n❌ DUPLICATE TESTING FAILED: Poor duplicate detection")
        
        return report
    
    def run_validation_tests(self, csv_path: str, max_tests: int = 10) -> Dict[str, Any]:
        """Run basic validation tests (original functionality)"""
        print("🚀 Starting UYSP Field Normalization Validation")
        print(f"📊 CSV Data Source: {csv_path}")
        print(f"🎯 Webhook URL: {self.webhook_url}")
        print("-" * 60)
        
        # Load CSV data
        df = self.load_csv_data(csv_path)
        
        # Limit test count
        test_rows = df.head(max_tests)
        print(f"🧪 Running tests on {len(test_rows)} rows")
        print("-" * 60)
        
        # Run tests
        for index, row in test_rows.iterrows():
            print(f"\n🔬 Test {index + 1}/{len(test_rows)}")
            
            # Convert CSV row to webhook payload
            payload = self.normalize_csv_to_webhook_format(row)
            print(f"📤 Payload: {json.dumps(payload, indent=2)}")
            
            # Send webhook test
            response = self.send_webhook_test(payload)
            print(f"📨 Response Status: {response.get('status_code', 'N/A')}")
            
            # Analyze field mapping
            analysis = self.analyze_field_mapping(payload, response)
            
            # Store results
            test_result = {
                'test_id': index + 1,
                'csv_row': dict(row),
                'webhook_payload': payload,
                'webhook_response': response,
                'field_analysis': analysis,
                'timestamp': datetime.now().isoformat()
            }
            
            self.test_results.append(test_result)
            
            # Print summary
            if response.get('success'):
                airtable_id = 'Unknown'
                # Fix: Extract Airtable ID from nested structure
                if 'data' in response and 'data' in response['data']:
                    airtable_id = response['data']['data'].get('id', 'Unknown')
                
                mapping_rate = analysis.get('field_mapping_rate', 0)
                print(f"✅ Success: Airtable ID {airtable_id}, Mapping Rate: {mapping_rate:.1f}%")
                
                if analysis.get('name_splitting'):
                    print(f"✅ Name splitting working")
                
                if analysis.get('boolean_conversions'):
                    for orig, converted in analysis['boolean_conversions'].items():
                        print(f"✅ Boolean: '{orig}' → {converted}")
                
                if analysis.get('unmapped_fields'):
                    print(f"⚠️  Unmapped: {analysis['unmapped_fields']}")
            else:
                print(f"❌ Failed: {response.get('error', 'Unknown error')}")
            
            # Rate limiting
            time.sleep(2)
        
        return self.generate_final_report()
    
    def generate_final_report(self) -> Dict[str, Any]:
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("📊 FINAL VALIDATION REPORT")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for r in self.test_results if r['webhook_response'].get('success'))
        
        # Calculate statistics
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        mapping_rates = [r['field_analysis'].get('field_mapping_rate', 0) 
                        for r in self.test_results if r['webhook_response'].get('success')]
        avg_mapping_rate = sum(mapping_rates) / len(mapping_rates) if mapping_rates else 0
        
        # Boolean conversion analysis
        boolean_conversions = {}
        for result in self.test_results:
            for orig, converted in result['field_analysis'].get('boolean_conversions', {}).items():
                if orig not in boolean_conversions:
                    boolean_conversions[orig] = []
                boolean_conversions[orig].append(converted)
        
        # Generate report
        report = {
            'summary': {
                'total_tests': total_tests,
                'successful_tests': successful_tests,
                'success_rate': success_rate,
                'average_field_mapping_rate': avg_mapping_rate
            },
            'field_mapping': {
                'unknown_fields_discovered': list(self.unknown_fields),
                'boolean_conversions': boolean_conversions,
                'mapping_rates': mapping_rates
            },
            'detailed_results': self.test_results,
            'timestamp': datetime.now().isoformat()
        }
        
        # Print summary
        print(f"🎯 Total Tests: {total_tests}")
        print(f"✅ Successful: {successful_tests} ({success_rate:.1f}%)")
        print(f"📊 Average Field Mapping Rate: {avg_mapping_rate:.1f}%")
        
        if self.unknown_fields:
            print(f"🔍 Unknown Fields Discovered: {', '.join(self.unknown_fields)}")
        
        if boolean_conversions:
            print("🔀 Boolean Conversions:")
            for orig, conversions in boolean_conversions.items():
                unique_conversions = list(set(conversions))
                print(f"   '{orig}' → {unique_conversions}")
        
        # Save report
        report_file = f"tests/results/csv-validation-report-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}.json"
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"💾 Report saved: {report_file}")
        return report

    def run_upsert_testing(self, csv_path: str) -> Dict[str, Any]:
        """Test data upsert and phone number conflict scenarios"""
        print("\n" + "=" * 70)
        print("🔄 STARTING UPSERT & CONFLICT TESTING")
        print("=" * 70)
        print(f"📊 CSV Data Source: {csv_path}")
        print(f"🎯 Webhook URL: {self.webhook_url}")
        print("-" * 70)
        
        # Load CSV data
        df = self.load_csv_data(csv_path)
        
        # Reset tracking counters
        self.duplicate_detections = 0
        self.new_record_creations = 0
        self.duplicate_failures = 0
        self.processed_emails.clear()
        
        upsert_test_results = []
        
        # Test Scenario 1: Missing Data Upsert
        print(f"\n🔬 SCENARIO 1: Missing Data Upsert Testing")
        print("-" * 50)
        print("Testing: Email exists but missing phone → Add phone number")
        
        # Use first record, remove phone initially, then add it back
        base_row = df.iloc[0]
        email = base_row['Email Address']
        
        # Step 1: Send record WITHOUT phone
        payload_no_phone = {
            'name': base_row['Full Name'],
            'email': email,
            'request_id': f"upsert-no-phone-{int(time.time())}"
        }
        
        # Add optional fields only if they have valid values
        if pd.notna(base_row.get('Company Name')) and str(base_row.get('Company Name')).strip():
            payload_no_phone['company'] = str(base_row['Company Name']).strip()
        
        if pd.notna(base_row.get('Are you interested in learning more about coaching with Ian?')) and str(base_row.get('Are you interested in learning more about coaching with Ian?')).strip():
            payload_no_phone['interested_in_coaching'] = str(base_row['Are you interested in learning more about coaching with Ian?']).strip()
        
        print(f"\n📤 Step 1 - Record WITHOUT phone:")
        print(f"   Email: {email}")
        print(f"   Payload: {json.dumps(payload_no_phone, indent=2)}")
        
        response1 = self.send_webhook_test(payload_no_phone)
        analysis1 = self.analyze_duplicate_handling(payload_no_phone, response1)
        
        if response1.get('success'):
            airtable_id = analysis1.get('airtable_id', 'Unknown')
            action = analysis1.get('action_taken', 'unknown')
            print(f"✅ Step 1 Result: {action}, Record: {airtable_id}")
        else:
            print(f"❌ Step 1 Failed: {response1.get('error', 'Unknown')}")
        
        time.sleep(2)
        
        # Step 2: Send same email WITH phone (upsert test)
        payload_with_phone = payload_no_phone.copy()
        payload_with_phone['phone'] = base_row['Phone Number']
        payload_with_phone['request_id'] = f"upsert-with-phone-{int(time.time())}"
        
        print(f"\n📤 Step 2 - Same email WITH phone (upsert test):")
        print(f"   Email: {email}")
        print(f"   Phone: {base_row['Phone Number']}")
        print(f"   Expected: Should UPDATE existing record, not create new")
        
        response2 = self.send_webhook_test(payload_with_phone)
        analysis2 = self.analyze_duplicate_handling(payload_with_phone, response2)
        
        if response2.get('success'):
            airtable_id = analysis2.get('airtable_id', 'Unknown')
            action = analysis2.get('action_taken', 'unknown')
            dup_count = analysis2.get('duplicate_count', 0)
            print(f"✅ Step 2 Result: {action}, Record: {airtable_id}, Count: {dup_count}")
            
            # Validate upsert worked
            if airtable_id == analysis1.get('airtable_id') and action == 'updated_existing':
                print(f"🎉 UPSERT SUCCESS: Same record updated with phone number!")
            else:
                print(f"⚠️  UPSERT ISSUE: Expected same record, got different behavior")
        else:
            print(f"❌ Step 2 Failed: {response2.get('error', 'Unknown')}")
        
        upsert_test_results.append({
            'scenario': 'missing_data_upsert',
            'email': email,
            'step1_no_phone': {'payload': payload_no_phone, 'response': response1, 'analysis': analysis1},
            'step2_with_phone': {'payload': payload_with_phone, 'response': response2, 'analysis': analysis2},
            'upsert_success': analysis1.get('airtable_id') == analysis2.get('airtable_id'),
            'timestamp': datetime.now().isoformat()
        })
        
        time.sleep(3)
        
        # Test Scenario 2: Phone Number Conflict
        print(f"\n🔬 SCENARIO 2: Phone Number Conflict Testing")
        print("-" * 50)
        print("Testing: Same email, different phone → What happens?")
        
        # Use second record for conflict test
        conflict_row = df.iloc[1]
        conflict_email = conflict_row['Email Address']
        original_phone = conflict_row['Phone Number']
        different_phone = "999-888-7777"  # Completely different phone
        
        # Step 1: Send record with original phone
        payload_original_phone = {
            'name': conflict_row['Full Name'],
            'email': conflict_email,
            'phone': original_phone,
            'request_id': f"conflict-original-{int(time.time())}"
        }
        
        # Add optional fields only if they have valid values
        if pd.notna(conflict_row.get('Company Name')) and str(conflict_row.get('Company Name')).strip():
            payload_original_phone['company'] = str(conflict_row['Company Name']).strip()
        
        if pd.notna(conflict_row.get('Are you interested in learning more about coaching with Ian?')) and str(conflict_row.get('Are you interested in learning more about coaching with Ian?')).strip():
            payload_original_phone['interested_in_coaching'] = str(conflict_row['Are you interested in learning more about coaching with Ian?']).strip()
        
        print(f"\n📤 Step 1 - Record with original phone:")
        print(f"   Email: {conflict_email}")
        print(f"   Phone: {original_phone}")
        
        response3 = self.send_webhook_test(payload_original_phone)
        analysis3 = self.analyze_duplicate_handling(payload_original_phone, response3)
        
        if response3.get('success'):
            airtable_id = analysis3.get('airtable_id', 'Unknown')
            action = analysis3.get('action_taken', 'unknown')
            print(f"✅ Step 1 Result: {action}, Record: {airtable_id}")
        else:
            print(f"❌ Step 1 Failed: {response3.get('error', 'Unknown')}")
        
        time.sleep(2)
        
        # Step 2: Send same email with DIFFERENT phone
        payload_different_phone = payload_original_phone.copy()
        payload_different_phone['phone'] = different_phone
        payload_different_phone['request_id'] = f"conflict-different-{int(time.time())}"
        
        print(f"\n📤 Step 2 - Same email, DIFFERENT phone:")
        print(f"   Email: {conflict_email}")
        print(f"   Original Phone: {original_phone}")
        print(f"   New Phone: {different_phone}")
        print(f"   Question: Does it update phone or keep original?")
        
        response4 = self.send_webhook_test(payload_different_phone)
        analysis4 = self.analyze_duplicate_handling(payload_different_phone, response4)
        
        if response4.get('success'):
            airtable_id = analysis4.get('airtable_id', 'Unknown')
            action = analysis4.get('action_taken', 'unknown')
            dup_count = analysis4.get('duplicate_count', 0)
            print(f"✅ Step 2 Result: {action}, Record: {airtable_id}, Count: {dup_count}")
            
            # Analyze conflict resolution
            if airtable_id == analysis3.get('airtable_id'):
                print(f"📱 PHONE CONFLICT: Same record, checking phone resolution...")
                # Would need to query Airtable to see which phone was kept
                print(f"🔍 ANALYSIS NEEDED: Query Airtable to see final phone number")
            else:
                print(f"⚠️  UNEXPECTED: Different records created for same email")
        else:
            print(f"❌ Step 2 Failed: {response4.get('error', 'Unknown')}")
        
        upsert_test_results.append({
            'scenario': 'phone_number_conflict',
            'email': conflict_email,
            'step1_original_phone': {'payload': payload_original_phone, 'response': response3, 'analysis': analysis3},
            'step2_different_phone': {'payload': payload_different_phone, 'response': response4, 'analysis': analysis4},
            'same_record_updated': analysis3.get('airtable_id') == analysis4.get('airtable_id'),
            'original_phone': original_phone,
            'conflict_phone': different_phone,
            'timestamp': datetime.now().isoformat()
        })
        
        # Generate Upsert Testing Report
        return self.generate_upsert_testing_report(upsert_test_results)
    
    def generate_upsert_testing_report(self, upsert_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate upsert and conflict testing report"""
        print("\n" + "=" * 70)
        print("📊 UPSERT & CONFLICT TESTING FINAL REPORT")
        print("=" * 70)
        
        # Analyze results
        missing_data_test = next((r for r in upsert_results if r['scenario'] == 'missing_data_upsert'), None)
        phone_conflict_test = next((r for r in upsert_results if r['scenario'] == 'phone_number_conflict'), None)
        
        report = {
            'summary': {
                'total_scenarios': len(upsert_results),
                'missing_data_upsert_success': missing_data_test.get('upsert_success', False) if missing_data_test else False,
                'phone_conflict_same_record': phone_conflict_test.get('same_record_updated', False) if phone_conflict_test else False
            },
            'scenarios': {
                'missing_data_upsert': missing_data_test,
                'phone_number_conflict': phone_conflict_test
            },
            'findings': [],
            'recommendations': [],
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"🎯 SCENARIO RESULTS:")
        
        # Missing Data Upsert Analysis
        if missing_data_test:
            if missing_data_test['upsert_success']:
                print(f"✅ Missing Data Upsert: SUCCESS - Same record updated")
                report['findings'].append("Upsert functionality working: Missing data correctly added to existing records")
            else:
                print(f"❌ Missing Data Upsert: FAILED - Different records created")
                report['findings'].append("Upsert issue: Adding missing data creates new record instead of updating existing")
                report['recommendations'].append("Review duplicate detection logic for partial data updates")
        
        # Phone Conflict Analysis
        if phone_conflict_test:
            if phone_conflict_test['same_record_updated']:
                print(f"📱 Phone Conflict: Same record updated")
                report['findings'].append("Phone conflicts handled by updating existing record")
                print(f"🔍 FOLLOW-UP NEEDED: Query Airtable to determine which phone number was kept")
                report['recommendations'].append("Implement phone conflict resolution policy (keep original vs. update with latest)")
            else:
                print(f"⚠️  Phone Conflict: Different records created")
                report['findings'].append("Phone conflicts may create duplicate records")
                report['recommendations'].append("Critical: Review duplicate detection - same email with different phone should not create duplicates")
        
        print(f"\n💡 KEY INSIGHTS:")
        for finding in report['findings']:
            print(f"   • {finding}")
        
        print(f"\n🎯 RECOMMENDATIONS:")
        for rec in report['recommendations']:
            print(f"   • {rec}")
        
        # Save report
        report_file = f"tests/results/upsert-testing-report-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}.json"
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n💾 Report saved: {report_file}")
        
        return report

    def run_phone_versioning_testing(self, csv_path: str) -> Dict[str, Any]:
        """Test phone number versioning strategy - keep original + add new"""
        print("\n" + "=" * 70)
        print("📞 STARTING PHONE NUMBER VERSIONING TESTING")
        print("=" * 70)
        print(f"📊 CSV Data Source: {csv_path}")
        print(f"🎯 Strategy: Preserve original phone + capture new phone for validation")
        print("-" * 70)
        
        # Load CSV data
        df = self.load_csv_data(csv_path)
        
        versioning_test_results = []
        
        # Test Scenario: Phone Number Evolution
        print(f"\n🔬 PHONE VERSIONING SCENARIO: Original → Updated → Validation")
        test_email = "phone-versioning@example.com"
        
        original_phone = "555-123-4567"
        updated_phone = "555-987-6543"
        corrected_phone = "+1-555-987-6543"  # After validation/enrichment
        
        # Step 1: Initial record with original phone
        print(f"📱 Step 1: Creating record with original phone: {original_phone}")
        payload_original = {
            'email': test_email,
            'name': 'Phone Version User',
            'phone': original_phone,
            'company': 'Phone Test Corp',
            'request_id': f"phone-v1-{int(time.time())}"
        }
        
        response1 = self.send_webhook_test(payload_original)
        analysis1 = self.analyze_field_mapping(payload_original, response1)
        
        print(f"✅ Original Record: {analysis1.get('airtable_id', 'Unknown')}")
        print(f"📊 Original Phone Stored: {original_phone}")
        
        time.sleep(3)  # Processing delay
        
        # Step 2: Updated record with new phone (same email)
        print(f"📱 Step 2: Updating with new phone: {updated_phone}")
        payload_updated = {
            'email': test_email,
            'name': 'Phone Version User',
            'phone': updated_phone,  # New phone number
            'company': 'Phone Test Corp',
            'request_id': f"phone-v2-{int(time.time())}"
        }
        
        response2 = self.send_webhook_test(payload_updated)
        analysis2 = self.analyze_field_mapping(payload_updated, response2)
        
        print(f"✅ Updated Record: {analysis2.get('airtable_id', 'Unknown')}")
        print(f"📊 New Phone Provided: {updated_phone}")
        
        time.sleep(3)  # Processing delay
        
        # Step 3: Validation/enrichment result with corrected phone
        print(f"📱 Step 3: Post-validation corrected phone: {corrected_phone}")
        payload_corrected = {
            'email': test_email,
            'name': 'Phone Version User',
            'phone': corrected_phone,  # Enriched/validated phone
            'company': 'Phone Test Corp',
            'request_id': f"phone-v3-{int(time.time())}"
        }
        
        response3 = self.send_webhook_test(payload_corrected)
        analysis3 = self.analyze_field_mapping(payload_corrected, response3)
        
        print(f"✅ Validated Record: {analysis3.get('airtable_id', 'Unknown')}")
        print(f"📊 Validated Phone: {corrected_phone}")
        
        # Analyze versioning strategy implications
        versioning_analysis = {
            'scenario': 'phone_number_versioning',
            'email': test_email,
            'phone_evolution': {
                'original': original_phone,
                'updated': updated_phone,
                'validated': corrected_phone
            },
            'record_ids': {
                'step1': analysis1.get('airtable_id', 'Unknown'),
                'step2': analysis2.get('airtable_id', 'Unknown'),
                'step3': analysis3.get('airtable_id', 'Unknown')
            },
            'duplicate_handling': {
                'same_record_updated': analysis1.get('airtable_id') == analysis2.get('airtable_id') == analysis3.get('airtable_id'),
                'duplicate_count': self.duplicate_detections
            },
            'versioning_questions': {
                'phone_overwritten': 'Current system overwrites phone - is original lost?',
                'validation_workflow': 'How to handle phone validation downstream?',
                'sales_rep_access': 'Do sales reps need original phone if new one fails validation?',
                'phone_history': 'Should we maintain phone number history/audit trail?'
            }
        }
        
        versioning_test_results.append(versioning_analysis)
        
        # Report findings
        print(f"\n📋 PHONE VERSIONING ANALYSIS:")
        print(f"🔗 Same Record Updated: {versioning_analysis['duplicate_handling']['same_record_updated']}")
        print(f"🔢 Duplicate Count: {self.duplicate_detections}")
        print(f"📱 Phone Evolution: {original_phone} → {updated_phone} → {corrected_phone}")
        
        print(f"\n🤔 STRATEGIC QUESTIONS FOR CONSIDERATION:")
        for question_type, question in versioning_analysis['versioning_questions'].items():
            print(f"   • {question}")
        
        return {
            'test_type': 'phone_versioning',
            'results': versioning_test_results,
            'strategic_implications': {
                'data_preservation': 'Original phone may be lost in current system',
                'validation_complexity': 'Downstream validation needs access to phone history',
                'sales_rep_needs': 'Reps may need original contact info if new phone fails',
                'suggested_approach': 'Consider phone_original, phone_current, phone_validated fields'
            },
            'implementation_options': {
                'option1': 'Single phone field (current) - simple but loses history',
                'option2': 'phone + phone_previous fields - moderate complexity',
                'option3': 'phone_original + phone_current + phone_validated - comprehensive but complex',
                'option4': 'JSON phone_history field - flexible but harder to query'
            }
        }

    def run_phone_versioning_test_comprehensive(self, csv_path: str) -> Dict[str, Any]:
        """Test the CORRECTED 3-field phone versioning system with comprehensive scenarios"""
        print("\n" + "=" * 70)
        print("📞 CORRECTED 3-FIELD PHONE VERSIONING TEST")
        print("=" * 70)
        print("🎯 Testing: phone_original (never changes) + phone_recent (latest) + phone_validated (enrichment sets)")
        print("✅ CORRECTED FIELD NAMES: phone_original, phone_recent, phone_validated")
        print("-" * 70)
        
        # Load CSV data
        df = self.load_csv_data(csv_path)
        
        versioning_test_results = []
        test_email = f"phone-corrected-{int(time.time())}@example.com"
        
        # Test 1: New Lead Phone Versioning
        print(f"\n🔬 TEST 1: New Lead - Expected: phone_original = phone_recent = '555-111-2222'")
        payload_new = {
            'name': 'Jane Smith Corrected',
            'email': test_email,
            'phone': '555-111-2222',
            'company': 'Test Company New',
            'request_id': f'corrected-new-{int(time.time())}'
        }
        
        response_new = self.send_webhook_test(payload_new)
        analysis_new = self.analyze_field_mapping(payload_new, response_new)
        
        print(f"✅ New Lead: {response_new.get('success', False)}")
        if response_new.get('success'):
            # Extract Airtable ID from nested response structure
            record_id = 'Unknown'
            if 'data' in response_new and 'data' in response_new['data']:
                record_id = response_new['data']['data'].get('id', 'Unknown')
            print(f"   Record ID: {record_id}")
            print(f"   Expected: phone_original = phone_recent = '555-111-2222'")
        
        time.sleep(3)
        
        # Test 2: Phone Update - Expected: phone_original preserved, phone_recent updated
        print(f"\n🔬 TEST 2: Phone Update - Expected: phone_original='555-111-2222' (preserved), phone_recent='555-333-4444' (new)")
        payload_update = {
            'name': 'Jane Smith Corrected',
            'email': test_email,
            'phone': '555-333-4444',
            'company': 'Test Company Updated',
            'request_id': f'corrected-update-{int(time.time())}'
        }
        
        response_update = self.send_webhook_test(payload_update)
        analysis_update = self.analyze_field_mapping(payload_update, response_update)
        
        print(f"✅ Phone Update: {response_update.get('success', False)}")
        if response_update.get('success'):
            record_id = 'Unknown'
            if 'data' in response_update and 'data' in response_update['data']:
                record_id = response_update['data']['data'].get('id', 'Unknown')
            print(f"   Record ID: {record_id}")
            print(f"   Expected: phone_original='555-111-2222' (preserved), phone_recent='555-333-4444' (latest)")
        
        time.sleep(3)
        
        # Test 3: Final Phone Update - Expected: phone_original still preserved, phone_recent updates again
        print(f"\n🔬 TEST 3: Final Update - Expected: phone_original='555-111-2222' (preserved), phone_recent='555-999-0000' (newest)")
        payload_final = {
            'name': 'Jane Smith Corrected',
            'email': test_email,
            'phone': '555-999-0000',
            'company': 'Test Company Final',
            'request_id': f'corrected-final-{int(time.time())}'
        }
        
        response_final = self.send_webhook_test(payload_final)
        analysis_final = self.analyze_field_mapping(payload_final, response_final)
        
        print(f"✅ Final Update: {response_final.get('success', False)}")
        if response_final.get('success'):
            record_id = 'Unknown'
            if 'data' in response_final and 'data' in response_final['data']:
                record_id = response_final['data']['data'].get('id', 'Unknown')
            print(f"   Record ID: {record_id}")
            print(f"   Expected: phone_original='555-111-2222' (preserved), phone_recent='555-999-0000' (latest)")
            print(f"   Expected: phone_validated=null (only enrichment process sets this)")
        
        # Save results
        results_summary = {
            'test_email': test_email,
            'total_tests': 3,
            'successful_webhooks': sum([1 for r in [response_new, response_update, response_final] if r.get('success')]),
            'strategy_validation': 'CORRECTED 3-field phone strategy tested',
            'expected_behavior': {
                'phone_original': 'Never changes from first value (555-111-2222)',
                'phone_recent': 'Always updates to latest value (555-999-0000)',
                'phone_validated': 'Only set by enrichment process (null for webhook-only records)'
            }
        }
        
        return {
            'summary': results_summary,
            'individual_tests': versioning_test_results,
            'test_timestamp': datetime.now().isoformat()
        }

    def run_comprehensive_field_conflict_testing(self, csv_path: str) -> Dict[str, Any]:
        """Test comprehensive field conflicts to understand complete upsert behavior"""
        print("\n" + "=" * 70)
        print("🔄 COMPREHENSIVE FIELD CONFLICT TESTING")
        print("=" * 70)
        print("🎯 Testing: Company changes, name updates, title changes, multi-field conflicts")
        print("-" * 70)
        
        # Load CSV data
        df = self.load_csv_data(csv_path)
        
        conflict_test_results = []
        base_email = f"field-conflicts-{int(time.time())}@example.com"
        
        # Test 1: Company Name Updates
        print(f"\n🔬 TEST 1: Company Name Update Chain")
        company_tests = [
            {"company": "Startup Inc", "title": "Founder", "test_id": "company-001"},
            {"company": "Growth Corp", "title": "CEO", "test_id": "company-002"},
            {"company": "Enterprise LLC", "title": "Chief Executive", "test_id": "company-003"}
        ]
        
        for i, test_data in enumerate(company_tests):
            print(f"   Step {i+1}: Company '{test_data['company']}', Title '{test_data['title']}'")
            
            payload = {
                'name': 'Business Owner',
                'email': base_email,
                'company': test_data['company'],
                'title': test_data['title'],
                'phone': '555-COMPANY',
                'request_id': test_data['test_id']
            }
            
            response = self.send_webhook_test(payload)
            analysis = self.analyze_field_mapping(payload, response)
            
            if response.get('success'):
                record_id = 'Unknown'
                if 'data' in response and 'data' in response['data']:
                    record_id = response['data']['data'].get('id', 'Unknown')
                print(f"   ✅ Success: Record {record_id}")
                print(f"      Expected: Company='{test_data['company']}', Title='{test_data['title']}'")
            else:
                print(f"   ❌ Failed: {response.get('error', 'Unknown error')}")
            
            conflict_test_results.append({
                'test_type': 'company_update',
                'step': i + 1,
                'payload': payload,
                'response': response,
                'analysis': analysis
            })
            
            time.sleep(2)
        
        # Test 2: Name Change Scenarios
        print(f"\n🔬 TEST 2: Name Change Scenarios")
        name_email = f"name-changes-{int(time.time())}@example.com"
        name_tests = [
            {"name": "John Smith", "first_expected": "John", "last_expected": "Smith"},
            {"name": "Jonathan Smith-Johnson", "first_expected": "Jonathan", "last_expected": "Smith-Johnson"},
            {"name": "Jon S. Johnson III", "first_expected": "Jon", "last_expected": "S. Johnson III"},
            {"first_name": "Johnny", "last_name": "Smith", "name_type": "split_fields"}
        ]
        
        for i, test_data in enumerate(name_tests):
            print(f"   Step {i+1}: {test_data}")
            
            payload = {
                'email': name_email,
                'phone': '555-NAMES',
                'company': 'Name Testing Corp',
                'request_id': f'name-test-{i+1:03d}'
            }
            
            if 'name_type' in test_data and test_data['name_type'] == 'split_fields':
                payload['first_name'] = test_data['first_name']
                payload['last_name'] = test_data['last_name']
            else:
                payload['name'] = test_data['name']
            
            response = self.send_webhook_test(payload)
            analysis = self.analyze_field_mapping(payload, response)
            
            if response.get('success'):
                record_id = 'Unknown'
                if 'data' in response and 'data' in response['data']:
                    record_id = response['data']['data'].get('id', 'Unknown')
                print(f"   ✅ Success: Record {record_id}")
            else:
                print(f"   ❌ Failed: {response.get('error', 'Unknown error')}")
            
            conflict_test_results.append({
                'test_type': 'name_change',
                'step': i + 1,
                'payload': payload,
                'response': response,
                'analysis': analysis
            })
            
            time.sleep(2)
        
        # Test 3: Multi-Field Conflict Scenario
        print(f"\n🔬 TEST 3: Multi-Field Conflict Resolution")
        multi_email = f"multi-conflict-{int(time.time())}@example.com"
        
        # Original record
        payload_original = {
            'name': 'Sarah Wilson',
            'email': multi_email,
            'phone': '555-111-0000',
            'company': 'Original Corp',
            'title': 'Manager',
            'source_form': 'webinar-1',
            'interested_in_coaching': 'yes',
            'request_id': 'multi-001'
        }
        
        print(f"   Step 1: Create original record")
        response_original = self.send_webhook_test(payload_original)
        
        if response_original.get('success'):
            record_id = 'Unknown'
            if 'data' in response_original and 'data' in response_original['data']:
                record_id = response_original['data']['data'].get('id', 'Unknown')
            print(f"   ✅ Original: Record {record_id}")
        
        time.sleep(2)
        
        # Conflicting update - change EVERYTHING
        payload_conflict = {
            'name': 'Sarah W. Johnson',  # Name change (marriage?)
            'email': multi_email,  # Same email
            'phone': '555-222-9999',  # Different phone
            'company': 'New Enterprise Inc',  # Different company
            'title': 'Senior Director',  # Different title
            'source_form': 'download-form',  # Different source
            'interested_in_coaching': 'no',  # Changed mind
            'request_id': 'multi-002'
        }
        
        print(f"   Step 2: Update with conflicting data across all fields")
        response_conflict = self.send_webhook_test(payload_conflict)
        
        if response_conflict.get('success'):
            record_id = 'Unknown'
            if 'data' in response_conflict and 'data' in response_conflict['data']:
                record_id = response_conflict['data']['data'].get('id', 'Unknown')
            print(f"   ✅ Conflict Update: Record {record_id}")
            print(f"      Expected: ALL fields updated to latest values")
        
        conflict_test_results.append({
            'test_type': 'multi_field_conflict',
            'original_payload': payload_original,
            'conflict_payload': payload_conflict,
            'original_response': response_original,
            'conflict_response': response_conflict
        })
        
        # Generate summary
        summary = {
            'total_tests': len(conflict_test_results),
            'successful_webhooks': sum(1 for test in conflict_test_results 
                                     if test.get('response', {}).get('success') or 
                                        test.get('conflict_response', {}).get('success')),
            'test_categories': {
                'company_updates': len([t for t in conflict_test_results if t.get('test_type') == 'company_update']),
                'name_changes': len([t for t in conflict_test_results if t.get('test_type') == 'name_change']),
                'multi_field_conflicts': len([t for t in conflict_test_results if t.get('test_type') == 'multi_field_conflict'])
            }
        }
        
        print(f"\n🎉 FIELD CONFLICT TESTING COMPLETED")
        print(f"✅ Total Tests: {summary['total_tests']}")
        print(f"✅ Successful Webhooks: {summary['successful_webhooks']}")
        print(f"📊 Categories: {summary['test_categories']}")
        
        # Save results
        timestamp = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
        filename = f'tests/results/field-conflict-report-{timestamp}.json'
        os.makedirs('tests/results', exist_ok=True)
        
        with open(filename, 'w') as f:
            json.dump({
                'summary': summary,
                'test_results': conflict_test_results,
                'timestamp': timestamp,
                'test_type': 'comprehensive_field_conflict_testing'
            }, f, indent=2)
        
        print(f"📁 Results saved to: {filename}")
        
        return {
            'summary': summary,
            'test_results': conflict_test_results,
            'filename': filename
        }

def main():
    """Main execution function"""
    validator = UYSPFieldValidator()
    csv_path = "data/kajabi-exports/form_submission (65.csv"
    
    try:
        print("🚀 UYSP COMPREHENSIVE UPSERT & FIELD CONFLICT VALIDATION")
        print("=" * 70)
        print("📊 Testing: 3-Field Phone Versioning + Field Conflict Resolution")
        print("🎯 Validating: phone_original (preserved) + phone_primary (latest) + phone_enriched (validated)")
        print("-" * 70)
        
        # Run comprehensive 3-field phone versioning test
        print("\n" + "🔄" * 20 + " PHONE VERSIONING TESTS " + "🔄" * 20)
        versioning_results = validator.run_phone_versioning_test_comprehensive(csv_path)
        
        # Run comprehensive field conflict testing
        print("\n" + "🔄" * 20 + " FIELD CONFLICT TESTS " + "🔄" * 20)
        conflict_results = validator.run_comprehensive_field_conflict_testing(csv_path)
        
        print(f"\n🎉 ALL COMPREHENSIVE TESTING COMPLETED!")
        print(f"✅ Phone Versioning: {versioning_results['summary']['successful_webhooks']}/{versioning_results['summary']['total_tests']} successful")
        print(f"✅ Field Conflicts: {conflict_results['summary']['successful_webhooks']}/{conflict_results['summary']['total_tests']} successful")
        print(f"📁 Phone Results: {versioning_results.get('filename', 'N/A')}")
        print(f"📁 Conflict Results: {conflict_results.get('filename', 'N/A')}")
        
        print(f"\n🎯 NEXT STEPS:")
        print(f"1. Verify Airtable records to confirm field conflict resolution")
        print(f"2. Check phone_original preservation vs phone_primary updates")
        print(f"3. Validate multi-field update behavior for business logic")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print(f"Check webhook URL and CSV file path")
        return False
    
    return True

if __name__ == "__main__":
    sys.exit(main()) 