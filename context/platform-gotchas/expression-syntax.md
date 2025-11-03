# Expression Syntax Gotchas

## Gotcha #3: Spacing in Expressions
**Correct**: `{{ $json.field }}`  
**Wrong**: `{{$json.field}}`  
**Result**: Silent failure - returns empty/undefined  
**No Error Message**: Fails without warning  

**Common Failures**:
- Airtable filter formulas
- IF node conditions
- Code node variable references

## Gotcha #4: Nested Expression Limitations
**Issue**: Airtable filterByFormula rejects nested n8n expressions  
**Symptom**: "Expression error: Nested expressions not supported"  

**Example That Fails**:
```javascript
AND({email} = '{{ $node["Webhook"].json.email }}', {date} > '{{ $now.minus(7, 'days') }}')
```

**Workaround Pattern**:
```javascript
// Step 1: Code node builds formula
const email = $json.email;
const cutoffDate = $now.minus(7, 'days').toISOString();
return { 
  formula: `AND({email} = '${email}', {date} > '${cutoffDate}')` 
};

// Step 2: Airtable node uses simple reference
{{ $json.formula }}
```

## Safe Expression Patterns
- Always use spaces in expressions
- Build complex formulas in Code nodes first
- Reference simple variables in downstream nodes
- Test expressions in isolation 