#!/bin/bash

# UYSP Comprehensive Test Runner Script
# Automates the execution of all webhook tests with proper verification

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"
TEST_SUITE_FILE="comprehensive-test-suite.json"
RESULTS_DIR="results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$RESULTS_DIR/test-report-$TIMESTAMP.txt"

# Ensure results directory exists
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 UYSP Comprehensive Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if [ ! -f "$TEST_SUITE_FILE" ]; then
    echo -e "${RED}❌ Test suite file not found: $TEST_SUITE_FILE${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is required but not installed. Please install jq first.${NC}"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is required but not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Initialize report file
echo "UYSP Comprehensive Test Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to log test result
log_test_result() {
    local test_id="$1"
    local test_name="$2"
    local status="$3"
    local details="$4"
    
    echo "Test: $test_id - $test_name" >> "$REPORT_FILE"
    echo "Status: $status" >> "$REPORT_FILE"
    echo "Details: $details" >> "$REPORT_FILE"
    echo "Time: $(date)" >> "$REPORT_FILE"
    echo "----------------------------------------" >> "$REPORT_FILE"
}

# Function to execute a single test
execute_test() {
    local test_id="$1"
    local test_name="$2"
    local payload="$3"
    
    echo -e "${BLUE}🔄 Executing Test: $test_id - $test_name${NC}"
    
    # Display the payload
    echo -e "${YELLOW}📤 Payload:${NC}"
    echo "$payload" | jq '.'
    
    echo -e "${YELLOW}⚠️  MANUAL STEP REQUIRED:${NC}"
    echo "1. Go to n8n workflow and click 'Execute Workflow'"
    echo "2. Press Enter when ready to send payload..."
    read -p ""
    
    # Execute curl command
    echo -e "${BLUE}🚀 Sending payload...${NC}"
    local curl_command="curl -X POST '$WEBHOOK_URL' -H 'Content-Type: application/json' -d '$payload' -s"
    local response
    
    if response=$(eval "$curl_command"); then
        echo -e "${GREEN}✅ Payload sent successfully${NC}"
        echo "Response: $response"
        
        # Wait for processing
        echo -e "${YELLOW}⏳ Waiting 5 seconds for processing...${NC}"
        sleep 5
        
        # Manual verification
        echo -e "${YELLOW}🔍 Manual Verification Required:${NC}"
        echo "Please check:"
        echo "1. Was an Airtable record created?"
        echo "2. Were all fields normalized correctly?"
        echo "3. Did the workflow run without errors?"
        
        local verification_result
        read -p "Did the test PASS? (y/n): " verification_result
        
        if [[ "$verification_result" =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}✅ Test $test_id PASSED${NC}"
            ((PASSED_TESTS++))
            log_test_result "$test_id" "$test_name" "PASSED" "Manual verification successful"
            
            # Ask for Airtable record ID
            read -p "Enter Airtable record ID (optional): " record_id
            if [ ! -z "$record_id" ]; then
                echo "Record ID: $record_id" >> "$REPORT_FILE"
            fi
        else
            echo -e "${RED}❌ Test $test_id FAILED${NC}"
            ((FAILED_TESTS++))
            read -p "Enter failure reason: " failure_reason
            log_test_result "$test_id" "$test_name" "FAILED" "$failure_reason"
        fi
    else
        echo -e "${RED}❌ Test $test_id FAILED - Curl execution failed${NC}"
        ((FAILED_TESTS++))
        log_test_result "$test_id" "$test_name" "FAILED" "Curl execution failed"
    fi
    
    ((TOTAL_TESTS++))
    echo ""
}

# Function to run tests from a category
run_category_tests() {
    local category="$1"
    local category_name="$2"
    
    echo -e "${BLUE}📂 Running category: $category_name${NC}"
    
    # Get number of tests in category
    local test_count
    test_count=$(jq -r ".test_categories.$category.tests | length" "$TEST_SUITE_FILE")
    
    echo "Found $test_count tests in this category"
    
    # Run each test in the category
    for ((i=0; i<test_count; i++)); do
        local test_id
        local test_name
        local payload
        
        test_id=$(jq -r ".test_categories.$category.tests[$i].id" "$TEST_SUITE_FILE")
        test_name=$(jq -r ".test_categories.$category.tests[$i].name" "$TEST_SUITE_FILE")
        payload=$(jq -c ".test_categories.$category.tests[$i].payload" "$TEST_SUITE_FILE")
        
        execute_test "$test_id" "$test_name" "$payload"
        
        # Pause between tests unless it's the last test
        if [ $i -lt $((test_count - 1)) ]; then
            echo -e "${YELLOW}⏸️  Pausing before next test...${NC}"
            read -p "Press Enter to continue to next test..."
        fi
    done
}

# Main execution
echo -e "${YELLOW}📋 Test Execution Options:${NC}"
echo "1. Run all tests"
echo "2. Run tests by category"
echo "3. Run single test"
read -p "Select option (1-3): " execution_option

case $execution_option in
    1)
        echo -e "${BLUE}🚀 Running ALL tests sequentially...${NC}"
        
        # Get all categories
        categories=$(jq -r '.test_categories | keys[]' "$TEST_SUITE_FILE")
        
        for category in $categories; do
            category_name=$(jq -r ".test_categories.$category.description" "$TEST_SUITE_FILE")
            run_category_tests "$category" "$category_name"
            
            echo -e "${YELLOW}📊 Category '$category' completed. Press Enter to continue to next category...${NC}"
            read -p ""
        done
        ;;
        
    2)
        echo -e "${YELLOW}📂 Available categories:${NC}"
        categories=$(jq -r '.test_categories | keys[]' "$TEST_SUITE_FILE")
        category_array=($categories)
        
        i=1
        for category in $categories; do
            description=$(jq -r ".test_categories.$category.description" "$TEST_SUITE_FILE")
            echo "$i. $category - $description"
            ((i++))
        done
        
        read -p "Select category (1-${#category_array[@]}): " category_choice
        selected_category_index=$((category_choice - 1))
        
        if [ $selected_category_index -ge 0 ] && [ $selected_category_index -lt ${#category_array[@]} ]; then
            selected_category="${category_array[$selected_category_index]}"
            category_name=$(jq -r ".test_categories.$selected_category.description" "$TEST_SUITE_FILE")
            run_category_tests "$selected_category" "$category_name"
        else
            echo -e "${RED}❌ Invalid category selection${NC}"
            exit 1
        fi
        ;;
        
    3)
        echo -e "${YELLOW}📋 Single test execution not implemented in bash version${NC}"
        echo "Please use the Node.js runner: node run-manual-tests.js"
        exit 1
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

# Generate final report
echo "" >> "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"
echo "FINAL SUMMARY" >> "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"
echo "Total Tests: $TOTAL_TESTS" >> "$REPORT_FILE"
echo "Passed: $PASSED_TESTS" >> "$REPORT_FILE"
echo "Failed: $FAILED_TESTS" >> "$REPORT_FILE"

if [ $TOTAL_TESTS -gt 0 ]; then
    success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)
    echo "Success Rate: $success_rate%" >> "$REPORT_FILE"
fi

echo "Report generated: $(date)" >> "$REPORT_FILE"

# Display final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 FINAL TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS ✅${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS ❌${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
    success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)
    echo -e "Success Rate: $success_rate%"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}💾 Detailed report saved to: $REPORT_FILE${NC}"

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the detailed report.${NC}"
    exit 1
else
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    exit 0
fi 