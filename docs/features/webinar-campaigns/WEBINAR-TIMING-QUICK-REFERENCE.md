# Webinar Nurture - Timing Quick Reference

**Visual Guide for Registration-to-Webinar Windows**

---

## 📅 TIMING MATRIX

```
Registration Time          Messages Sent              Message Steps        
Before Webinar            (Count)                     (Numbers)            
─────────────────────────────────────────────────────────────────────────
≥ 72 hours (3+ days)      ████ (4)                   1 → 2 → 3 → 4        
                          Ack → Value → 24hr → 1hr                        
                          
48-72 hours (2-3 days)    ████ (4)                   1 → 2 → 3 → 4        
                          Ack → Value → 24hr → 1hr                        
                          
36-48 hours               ████ (4)                   1 → 2 → 3 → 4        
                          Ack → Value → 24hr → 1hr                        
                          
24-36 hours               ███ (3)                    1 → 2 → 4            
                          Ack → Value → 1hr                               
                          (Skip 24hr - too close)                         
                          
12-24 hours               ██ (2)                     1 → 4                
                          Ack → 1hr                                       
                          (Skip Value & 24hr)                             
                          
3-12 hours                ██ (2)                     1 → 4                
                          Ack → 1hr                                       
                          
1-3 hours                 █ (1)                      1                    
                          Ack only                                        
                          
< 1 hour                  █ (1)                      1                    
                          Ack only (emergency)                            
```

---

## ⏱️ SPECIFIC TIME EXAMPLES

### Example 1: Week Advance (168 hours)
```
Monday 9:00 AM    → Register
Monday 9:05 AM    → Message 1: Acknowledgment
Tuesday 9:05 AM   → Message 2: Value Builder (+24hr)
Sunday 2:00 PM    → Message 3: 24hr Reminder (24hr before)
Monday 1:00 PM    → Message 4: 1hr Reminder (1hr before)
Monday 2:00 PM    → WEBINAR STARTS
```

### Example 2: Three Days Advance (72 hours)
```
Friday 2:00 PM    → Register
Friday 2:05 PM    → Message 1: Acknowledgment
Saturday 2:05 PM  → Message 2: Value Builder (+24hr)
Sunday 2:00 PM    → Message 3: 24hr Reminder (24hr before)
Monday 1:00 PM    → Message 4: 1hr Reminder (1hr before)
Monday 2:00 PM    → WEBINAR STARTS
```

### Example 3: Two Days Advance (48 hours)
```
Saturday 2:00 PM  → Register
Saturday 2:05 PM  → Message 1: Acknowledgment
Saturday 8:00 PM  → Message 2: Value Builder (+6hr)
Sunday 2:00 PM    → Message 3: 24hr Reminder (24hr before)
Monday 1:00 PM    → Message 4: 1hr Reminder (1hr before)
Monday 2:00 PM    → WEBINAR STARTS
```

### Example 4: One Day Advance (30 hours)
```
Sunday 8:00 AM    → Register
Sunday 8:05 AM    → Message 1: Acknowledgment
Sunday 8:00 PM    → Message 2: Value Builder (+12hr)
Monday 1:00 PM    → Message 4: 1hr Reminder (1hr before)
Monday 2:00 PM    → WEBINAR STARTS
[SKIP Message 3: 24hr window already passed]
```

### Example 5: Same Day Morning (6 hours)
```
Monday 8:00 AM    → Register
Monday 8:05 AM    → Message 1: Acknowledgment
Monday 1:00 PM    → Message 4: 1hr Reminder (1hr before)
Monday 2:00 PM    → WEBINAR STARTS
[SKIP Message 2 & 3: Not enough time]
```

### Example 6: Last Minute (2 hours)
```
Monday 12:00 PM   → Register
Monday 12:05 PM   → Message 1: Acknowledgment
Monday 1:00 PM    → Message 4: 1hr Reminder (1hr before)
Monday 2:00 PM    → WEBINAR STARTS
```

### Example 7: Emergency Registration (30 minutes)
```
Monday 1:30 PM    → Register
Monday 1:35 PM    → Message 1: Acknowledgment
Monday 2:00 PM    → WEBINAR STARTS
[SKIP All reminders: Too close to start]
```

---

## 🎯 MESSAGE TIMING RULES

### Message 1: Acknowledgment
- **When**: 5 minutes after registration
- **Always Sent**: YES (100% of registrations)
- **Skip Condition**: NEVER

### Message 2: Value Builder
- **When**: Variable (12-24 hours after acknowledgment)
- **Always Sent**: NO
- **Skip Condition**: Less than 24 hours until webinar

### Message 3: 24-Hour Reminder
- **When**: Exactly 24 hours before webinar
- **Always Sent**: NO
- **Skip Condition**: Registered less than 36 hours before webinar

### Message 4: 1-Hour Reminder
- **When**: Exactly 1 hour before webinar
- **Always Sent**: Usually YES
- **Skip Condition**: Only if registered less than 2 hours before webinar

---

## 🚦 DECISION TREE

```
Start: Lead Registers
    ↓
Calculate: Hours Until Webinar
    ↓
┌─────────────────────────┐
│ Hours Until Webinar?    │
└─────────────────────────┘
         │
         ├─→ ≥ 72 hr  → Send: 1,2,3,4 (Full Sequence)
         │
         ├─→ 36-72 hr → Send: 1,2,3,4 (Compressed timing)
         │
         ├─→ 24-36 hr → Send: 1,2,4 (Skip 24hr reminder)
         │
         ├─→ 12-24 hr → Send: 1,4 (Skip value & 24hr)
         │
         ├─→ 2-12 hr  → Send: 1,4 (Emergency mode)
         │
         ├─→ 1-2 hr   → Send: 1,4 (If time allows)
         │
         └─→ < 1 hr   → Send: 1 only (Acknowledgment)
```

---

## 📏 SPACING REQUIREMENTS

### Minimum Gaps Between Messages
- Acknowledgment → Value: **12 hours minimum**
- Value → 24hr Reminder: **6 hours minimum**
- 24hr Reminder → 1hr Reminder: **23 hours** (fixed)
- Any Message → Any Message: **1 hour minimum** (duplicate prevention)

### Maximum Gaps
- Acknowledgment → Value: **36 hours maximum**
- Value → 24hr Reminder: **48 hours maximum**

---

## 🔢 CALCULATION FORMULAS

### Hours Until Webinar
```javascript
const hoursUntil = (webinarTime - registrationTime) / (1000 * 60 * 60);
```

### Message 1 Time (Acknowledgment)
```javascript
const msg1Time = new Date(registrationTime.getTime() + (5 * 60 * 1000));
// +5 minutes
```

### Message 2 Time (Value Builder)
```javascript
// If ≥ 72 hours: +24 hours from acknowledgment
const msg2Time = new Date(msg1Time.getTime() + (24 * 60 * 60 * 1000));

// If 36-72 hours: Halfway between acknowledgment and 24hr reminder
const windowSize = (msg3Time - msg1Time);
const msg2Time = new Date(msg1Time.getTime() + (windowSize * 0.4));

// If 24-36 hours: +12 hours from acknowledgment
const msg2Time = new Date(msg1Time.getTime() + (12 * 60 * 60 * 1000));
```

### Message 3 Time (24hr Reminder)
```javascript
const msg3Time = new Date(webinarTime.getTime() - (24 * 60 * 60 * 1000));
// 24 hours before webinar (fixed)
```

### Message 4 Time (1hr Reminder)
```javascript
const msg4Time = new Date(webinarTime.getTime() - (1 * 60 * 60 * 1000));
// 1 hour before webinar (fixed)
```

---

## 🧪 EDGE CASE HANDLING

### Edge Case 1: Registered Exactly 24 Hours Before
- **Problem**: 24hr reminder would be NOW
- **Solution**: Skip 24hr reminder, send Value + 1hr only

### Edge Case 2: Registered Between 1-2 Hours Before
- **Problem**: Not enough time for 1hr reminder
- **Solution**: Send acknowledgment only

### Edge Case 3: Webinar Already Started
- **Problem**: Lead registered after webinar began
- **Solution**: Send acknowledgment with apology, offer replay

### Edge Case 4: Overnight Registration
- **Problem**: 24hr reminder falls at 3am
- **Solution**: Adjust to 9am same day? (Decision needed)

### Edge Case 5: Multiple Webinars
- **Problem**: Lead registered for 2 webinars
- **Solution**: Separate sequence per webinar, track independently

---

## 📊 TIMING VALIDATION CHECKS

Before sending any message, verify:

1. **Time Check**: Current time ≥ Scheduled send time
2. **Sequence Check**: Current position < Message step number
3. **Duplicate Check**: No message sent in last 60 minutes
4. **Webinar Check**: Webinar hasn't started yet
5. **Status Check**: Lead status = "Active", SMS Stop = FALSE

---

## 💾 AIRTABLE SCHEDULE STORAGE FORMAT

Store in `{Webinar Message Schedule}` field as JSON:

```json
{
  "registrationTime": "2025-11-04T09:00:00Z",
  "webinarTime": "2025-11-11T19:00:00Z",
  "hoursUntilWebinar": 166,
  "totalMessages": 4,
  "messages": [
    {
      "step": 1,
      "type": "acknowledgment",
      "sendAt": "2025-11-04T09:05:00Z",
      "delayHours": 0,
      "status": "sent"
    },
    {
      "step": 2,
      "type": "value_builder",
      "sendAt": "2025-11-05T09:05:00Z",
      "delayHours": 24,
      "status": "pending"
    },
    {
      "step": 3,
      "type": "24hr_reminder",
      "sendAt": "2025-11-10T19:00:00Z",
      "delayHours": 130,
      "status": "pending"
    },
    {
      "step": 4,
      "type": "1hr_reminder",
      "sendAt": "2025-11-11T18:00:00Z",
      "delayHours": 23,
      "status": "pending"
    }
  ]
}
```

---

**Quick Reference Card - Keep Handy During Implementation**  
**Last Updated**: 2025-11-02

