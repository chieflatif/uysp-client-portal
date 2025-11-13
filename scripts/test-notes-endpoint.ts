#!/usr/bin/env tsx
/**
 * Test the notes GET endpoint
 */

async function testNotesEndpoint() {
  const leadId = '18cd3573-2e78-437f-8945-4c1aba0c38f3'; // Jim Buttkus

  console.log(`Testing GET /api/leads/${leadId}/notes`);

  // Simulate what the component does
  try {
    const response = await fetch(`http://localhost:3000/api/leads/${leadId}/notes`, {
      headers: {
        'Cookie': 'next-auth.session-token=test', // This will fail auth but show if endpoint is reached
      }
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const text = await response.text();
    console.log('Response body:', text);

    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.log('Not valid JSON');
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testNotesEndpoint();