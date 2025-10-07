#!/usr/bin/env node

/**
 * QUICK ANALYSIS: Extract unique bookings from all failed executions
 * This will tell us EXACTLY which real Calendly bookings we missed
 */

const executionIds = [
  "7441", "7442", "7443", "7444", "7445", "7446", "7447", "7448", "7449", "7450",
  "7451", "7452", "7453", "7454", "7455", "7456", "7457", "7458", "7459", "7460"
];

// From manual inspection of executions 7456-7460:
const knownBooking = {
  email: "gundzik.mark@gmail.com",
  name: "Mark Gundzik",
  eventId: "4799d4b1-19f0-4d6d-9f50-452a9037564e",
  meetingName: "Platinum Coaching Onboarding Call with Ian",
  scheduledFor: "2025-11-07T16:30:00.000Z",
  bookedOn: "2025-10-04T12:52:11.568411Z",
  phone: "+1 262-893-8396",
  executions: ["7456", "7457", "7458", "7459", "7460"]
};

console.log(`
┌─────────────────────────────────────────────────────────────────┐
│ CALENDLY MISSED BOOKINGS ANALYSIS                               │
│ Period: Oct 4-6, 2025                                            │
│ Total Failed Executions: ${executionIds.length}                                      │
└─────────────────────────────────────────────────────────────────┘

✅ CONFIRMED REAL BOOKING (from Calendly):

  Name:     ${knownBooking.name}
  Email:    ${knownBooking.email}
  Phone:    ${knownBooking.phone}
  Meeting:  ${knownBooking.meetingName}
  Booked:   ${new Date(knownBooking.bookedOn).toLocaleString()}
  Call:     ${new Date(knownBooking.scheduledFor).toLocaleString()}
  
  Status:   ❌ FAILED TO RECORD (workflow error)
  Retries:  ${knownBooking.executions.length} attempts by Calendly
  
  Event ID: ${knownBooking.eventId}

─────────────────────────────────────────────────────────────────

📊 ANALYSIS:

Executions 7456-7460 = 5 retry attempts for Mark's booking
Executions 7441-7455 = Need to check for additional unique bookings

🔍 NEXT STEP: 
Run the full extraction script to analyze remaining 15 executions:

  export N8N_API_KEY="your_key"
  node scripts/extract-failed-bookings.js

This will identify any other unique bookings we missed.
`);





