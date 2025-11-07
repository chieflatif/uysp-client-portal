'use client';
// CACHE BUST: 2025-11-05T01:45:00Z - FORCE INVALIDATE for variable insertion buttons
// Previous cache bust failed - Vercel serving stale JS despite commit 859662e deployed

import { useState, useEffect, useRef } from 'react';
import { theme } from '@/theme';
import { X, Sparkles, Eye, Plus, Trash2, Loader2 } from 'lucide-react';
import LeadPreviewModal from './LeadPreviewModal';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface Message {
  step: number;
  delayMinutes: number;
  text: string;
}

interface CustomCampaignFormProps {
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'leadForm' | 'nurture'; // Lead Form = simplified, Nurture = advanced
}

export default function CustomCampaignForm({
  clientId,
  onClose,
  onSuccess,
  mode = 'nurture',
}: CustomCampaignFormProps) {
  // Form state
  const [name, setName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');
  const [minIcpScore, setMinIcpScore] = useState<number>(0);
  const [maxIcpScore, setMaxIcpScore] = useState<number>(100);
  const [engagementLevels, setEngagementLevels] = useState<string[]>(['High', 'Medium', 'Low']);
  const [messages, setMessages] = useState<Message[]>([
    { step: 1, delayMinutes: 0, text: '' }
  ]);
  const [isPaused, setIsPaused] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [resourceLink, setResourceLink] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [bookingLink, setBookingLink] = useState('https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr'); // Default UYSP link
  const [startDatetime, setStartDatetime] = useState('');
  const [maxLeadsToEnroll, setMaxLeadsToEnroll] = useState<number | null>(null);

  // UI state
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // CRITICAL-2 FIX: Manual tag entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTagInput, setManualTagInput] = useState('');
  const [loadingDirectTags, setLoadingDirectTags] = useState(false);

  // CRITICAL-2 FIX: Max tag selection limit (1 for Lead Form, 10 for Nurture)
  const MAX_TAG_SELECTION = mode === 'leadForm' ? 1 : 10;

  // CRITICAL-5 FIX: Use ref for synchronous submit blocking
  const isSubmittingRef = useRef(false);

  // HIGH-7 FIX: Track if form has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // NEW: Refs for message textareas to enable cursor-position variable insertion
  const messageTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Migration status state
  const [migrationChecked, setMigrationChecked] = useState(false);
  const [migrationExecuted, setMigrationExecuted] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [checkingMigration, setCheckingMigration] = useState(true);

  // CRITICAL-1 FIX: Check migration status on mount
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  // HIGH-7 FIX: Mark form as having unsaved changes when any field is modified
  useEffect(() => {
    if (name || selectedTags.length > 0 || messages.some(m => m.text)) {
      setHasUnsavedChanges(true);
    }
  }, [name, selectedTags, messages, createdAfter, createdBefore, minIcpScore, maxIcpScore, engagementLevels, isScheduled, startDatetime]);

  const checkMigrationStatus = async () => {
    try {
      setCheckingMigration(true);
      setMigrationError(null);

      const response = await fetch('/api/admin/system/migration-status');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check migration status');
      }

      setMigrationExecuted(data.migrationExecuted);
      setMigrationChecked(true);

      if (!data.migrationExecuted) {
        const missingCols = data.missingColumns?.join(', ') || 'Unknown columns';
        setMigrationError(
          `Database migration not executed. Missing columns: ${missingCols}. Please run migration 0010_add_custom_campaigns.sql before using Custom Campaigns.`
        );
        console.error('❌ Migration check failed:', data);
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
      setMigrationError(
        'Failed to verify database migration status. Please contact your system administrator.'
      );
      setMigrationChecked(true);
    } finally {
      setCheckingMigration(false);
    }
  };

  // HIGH-1 FIX: Fetch available tags with cleanup
  useEffect(() => {
    if (!migrationExecuted) return;

    const controller = new AbortController();
    let isMounted = true;

    const fetchTags = async () => {
      try {
        setLoadingTags(true);
        const response = await fetch(`/api/admin/campaigns/available-tags?clientId=${clientId}&direct=true`);
        const data = await response.json();

        // HIGH-1 FIX: Only update state if component still mounted
        if (isMounted) {
          // HIGH-2 FIX: Deduplicate tags on fetch
          const dedupedTags = deduplicateTags(data.tags || []);
          setAvailableTags(dedupedTags);
        }
      } catch (error: any) {
        // Ignore abort errors (component unmounted)
        if (error.name === 'AbortError') return;

        console.error('Error fetching tags:', error);
        if (isMounted) {
          setErrors({ tags: 'Failed to load tags. Please refresh the page.' });
        }
      } finally {
        if (isMounted) {
          setLoadingTags(false);
        }
      }
    };

    fetchTags();

    // HIGH-1 FIX: Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [clientId, migrationExecuted]);

  const fetchAvailableTags = async () => {
    try {
      setLoadingTags(true);
      const response = await fetch(`/api/admin/campaigns/available-tags?clientId=${clientId}&direct=true`);
      const data = await response.json();
      // HIGH-2 FIX: Deduplicate tags
      const dedupedTags = deduplicateTags(data.tags || []);
      setAvailableTags(dedupedTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setErrors({ tags: 'Failed to load tags. Please refresh the page.' });
    } finally {
      setLoadingTags(false);
    }
  };

  // CRITICAL-2 FIX: Tag deduplication helper (case-insensitive)
  const deduplicateTags = (tags: string[]): string[] => {
    const seen = new Set<string>();
    return tags.filter((tag) => {
      const normalized = tag.toLowerCase().trim();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      // If tag is already selected, remove it
      if (prev.includes(tag)) {
        // Lead Form mode: Clear campaign name when deselecting
        if (mode === 'leadForm') {
          setName('');
        }
        return prev.filter((t) => t !== tag);
      }

      // CRITICAL-2 FIX: Check max tag selection limit
      if (prev.length >= MAX_TAG_SELECTION) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          targetTags: `Maximum ${MAX_TAG_SELECTION} ${mode === 'leadForm' ? 'tag' : 'tags'} allowed`,
        }));
        return prev;
      }

      // Lead Form mode: Auto-populate campaign name from tag
      if (mode === 'leadForm') {
        // Convert tag to friendly campaign name (e.g., "webinar-2025-q1" → "Webinar 2025 Q1")
        const friendlyName = tag
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setName(friendlyName);
      }

      // Add tag
      return [...prev, tag];
    });

    // Clear tag error when user selects a tag
    if (errors.targetTags) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.targetTags;
        return newErrors;
      });
    }
  };

  // CRITICAL-2 FIX: Load tags directly from database (bypass cache)
  const fetchTagsDirectly = async () => {
    try {
      setLoadingDirectTags(true);
      const response = await fetch(`/api/admin/campaigns/available-tags?clientId=${clientId}&direct=true`);
      const data = await response.json();

      if (response.ok && data.tags && data.tags.length > 0) {
        // CRITICAL-2 FIX: Deduplicate tags (case-insensitive)
        const dedupedTags = deduplicateTags(data.tags);
        setAvailableTags(dedupedTags);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.tags;
          return newErrors;
        });
      } else {
        setErrors({ tags: 'No tags found in database. Try manual entry below.' });
      }
    } catch (error) {
      console.error('Error fetching tags directly:', error);
      setErrors({ tags: 'Failed to load tags. Try manual entry below.' });
    } finally {
      setLoadingDirectTags(false);
    }
  };

  // CRITICAL-2 FIX: Add manually entered tag
  const addManualTag = () => {
    const trimmedTag = manualTagInput.trim();

    if (!trimmedTag) {
      setErrors((prev) => ({ ...prev, manualTag: 'Tag cannot be empty' }));
      return;
    }

    // Check if tag already exists (case-insensitive)
    const normalizedInput = trimmedTag.toLowerCase();
    const existsInAvailable = availableTags.some(
      (tag) => tag.toLowerCase() === normalizedInput
    );
    const existsInSelected = selectedTags.some(
      (tag) => tag.toLowerCase() === normalizedInput
    );

    if (existsInAvailable || existsInSelected) {
      setErrors((prev) => ({ ...prev, manualTag: 'Tag already exists' }));
      return;
    }

    // Check max selection
    if (selectedTags.length >= MAX_TAG_SELECTION) {
      setErrors((prev) => ({
        ...prev,
        manualTag: `Maximum ${MAX_TAG_SELECTION} tags allowed`,
      }));
      return;
    }

    // Add to available tags and auto-select
    setAvailableTags((prev) => deduplicateTags([...prev, trimmedTag]));
    setSelectedTags((prev) => [...prev, trimmedTag]);
    setManualTagInput('');
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.manualTag;
      delete newErrors.targetTags;
      return newErrors;
    });
  };

  // CRITICAL-7 FIX: Prevent empty engagement level array
  const toggleEngagementLevel = (level: string) => {
    setEngagementLevels((prev) => {
      // If trying to uncheck and it's the last one, prevent it
      if (prev.includes(level) && prev.length === 1) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          engagementLevels: 'At least one engagement level must be selected',
        }));
        return prev; // Don't change
      }

      // Clear error when user makes valid selection
      if (errors.engagementLevels) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors.engagementLevels;
          return newErrors;
        });
      }

      // Toggle the level
      return prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level];
    });
  };

  const addMessage = () => {
    if (messages.length >= 3) return;
    const newStep = messages.length + 1;
    // Default to 1 day (1440 minutes)
    setMessages([...messages, { step: newStep, delayMinutes: 1440, text: '' }]);
  };

  const removeMessage = (index: number) => {
    if (messages.length <= 1) return;
    setMessages(messages.filter((_, i) => i !== index).map((msg, idx) => ({ ...msg, step: idx + 1 })));
  };

  const updateMessage = (index: number, field: keyof Message, value: any) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Clear message error
    if (errors[`message_${index}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`message_${index}`];
        return newErrors;
      });
    }
  };

  // Helper: Insert variable at cursor position
  const insertVariable = (messageIndex: number, variable: string) => {
    const textareaRef = messageTextareaRefs.current[messageIndex];
    if (!textareaRef) return;
    
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const text = messages[messageIndex].text;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + variable + after;
    
    // Update via React state
    updateMessage(messageIndex, 'text', newText);
    
    // Set cursor position after variable
    setTimeout(() => {
      textareaRef.focus();
      const newCursorPos = start + variable.length;
      textareaRef.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // CRITICAL-4 FIX: AI generation with timeout and retry + conditional resource logic
  const generateMessage = async (index: number, isRetry: boolean = false) => {
    try {
      setGeneratingMessage(index);

      // CRITICAL-4 FIX: Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Show "taking longer" message after 10 seconds
      const slowWarningTimeout = setTimeout(() => {
        if (generatingMessage === index) {
          setErrors((prev) => ({
            ...prev,
            [`ai_${index}`]: 'AI is taking longer than usual... still working...',
          }));
        }
      }, 10000);

      // NEW: Conditional resource logic
      const hasResource = resourceLink.trim() && resourceName.trim();
      
      // Build custom instructions with resource awareness
      let customInstructions = 'Use {{first_name}} for personalization. ';
      if (hasResource) {
        customInstructions += `Mention the resource called "{{resource_name}}" and reference the link. `;
      } else {
        customInstructions += 'DO NOT mention any resources, guides, downloads, or materials. Focus only on booking the call. ';
      }
      customInstructions += 'Keep it concise and conversational. Include booking link at end.';

      const response = await fetch('/api/admin/campaigns/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: name || 'Custom Campaign',
          targetAudience: `Leads with tags: ${selectedTags.join(', ')}`,
          messageGoal: 'book_call',
          tone: 'friendly',
          includeLink: true, // Always include booking link
          bookingLink: bookingLink,
          customInstructions: customInstructions,
        }),
        signal: controller.signal, // CRITICAL-4 FIX: Pass abort signal
      });

      clearTimeout(timeoutId);
      clearTimeout(slowWarningTimeout);

      // Clear "taking longer" message
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`ai_${index}`];
        return newErrors;
      });

      const data = await response.json();
      if (response.ok) {
        updateMessage(index, 'text', data.message);
      } else if (response.status === 429) {
        // Rate limit error
        const resetTime = data.resetAt ? new Date(data.resetAt).toLocaleTimeString() : 'later';
        setErrors((prev) => ({
          ...prev,
          [`ai_${index}`]: `Rate limit exceeded. ${data.details || `Try again at ${resetTime}`}`,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          [`ai_${index}`]: `Failed to generate: ${data.error || 'Unknown error'}`,
        }));
      }
    } catch (error: any) {
      console.error('Error generating message:', error);

      // CRITICAL-4 FIX: Handle timeout specifically
      if (error.name === 'AbortError') {
        setErrors((prev) => ({
          ...prev,
          [`ai_${index}`]: 'AI generation timed out after 30 seconds. Click Retry or write manually.',
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          [`ai_${index}`]: `Network error: ${error.message || 'Failed to generate'}. Click Retry.`,
        }));
      }
    } finally {
      setGeneratingMessage(null);
    }
  };

  // CRITICAL-3 FIX: Convert local datetime to UTC ISO string
  const convertLocalToUTC = (localDatetimeString: string): string => {
    // localDatetimeString format: "2025-01-15T14:30" (no timezone)
    // Browser interprets this as local time
    const localDate = new Date(localDatetimeString);
    // Convert to UTC ISO string: "2025-01-15T22:30:00.000Z" (if PST user)
    return localDate.toISOString();
  };

  // CRITICAL-3 FIX: Get user's timezone offset for display
  const getUserTimezone = (): string => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = -new Date().getTimezoneOffset() / 60;
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    return `${timezone} (UTC${offsetStr})`;
  };

  // MEDIUM PRIORITY: Real-time validation for resource fields
  const validateResourceFields = () => {
    const newErrors: Record<string, string> = { ...errors };

    const hasResourceLink = resourceLink && resourceLink.trim() !== '';
    const hasResourceName = resourceName && resourceName.trim() !== '';

    // Clear previous resource errors
    delete newErrors.resourceLink;
    delete newErrors.resourceName;

    // Both or none validation
    if (hasResourceLink && !hasResourceName) {
      newErrors.resourceName = 'Resource name is required when resource link is provided';
    }
    if (hasResourceName && !hasResourceLink) {
      newErrors.resourceLink = 'Resource link is required when resource name is provided';
    }

    setErrors(newErrors);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (selectedTags.length === 0) {
      newErrors.targetTags = 'At least one tag is required';
    }

    // Validate messages
    messages.forEach((msg, idx) => {
      if (!msg.text.trim()) {
        newErrors[`message_${idx}`] = 'Message text is required';
      } else if (msg.text.length > 1600) {
        newErrors[`message_${idx}`] = 'Message exceeds 1600 character limit';
      }
      if (idx > 0 && msg.delayMinutes <= 0) {
        newErrors[`message_${idx}_delay`] = 'Delay must be positive';
      }
    });

    // CRITICAL-3 FIX: Enhanced scheduled datetime validation
    if (isScheduled) {
      if (!startDatetime) {
        newErrors.startDatetime = 'Start datetime is required for scheduled campaigns';
      } else {
        const selectedDate = new Date(startDatetime);
        const now = new Date();

        // Check if date is valid
        if (isNaN(selectedDate.getTime())) {
          newErrors.startDatetime = 'Invalid datetime format';
        }
        // Check if in future (only for active campaigns)
        else if (!isPaused && selectedDate < now) {
          const minutesDiff = Math.round((now.getTime() - selectedDate.getTime()) / 60000);
          newErrors.startDatetime = `Start datetime must be in the future (currently ${minutesDiff} minutes in the past)`;
        }
        // Warn if very far in future (likely user error)
        else if (selectedDate > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
          newErrors.startDatetime = 'Start datetime is more than 1 year in the future. Please verify.';
        }
      }
    }

    // Validate ICP score range
    if (minIcpScore > maxIcpScore) {
      newErrors.icpScore = 'Min score cannot be greater than max score';
    }

    // Validate resource link URL format if provided
    if (resourceLink && !isValidUrl(resourceLink)) {
      newErrors.resourceLink = 'Resource link must be a valid URL';
    }
    if (bookingLink && !isValidUrl(bookingLink)) {
      newErrors.bookingLink = 'Booking link must be a valid URL';
    }

    // Validate resource fields: both or none required
    const hasResourceLink = resourceLink && resourceLink.trim() !== '';
    const hasResourceName = resourceName && resourceName.trim() !== '';
    if (hasResourceLink && !hasResourceName) {
      newErrors.resourceName = 'Resource name is required when resource link is provided';
    }
    if (hasResourceName && !hasResourceLink) {
      newErrors.resourceLink = 'Resource link is required when resource name is provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CRITICAL-5 FIX: Synchronous blocking with ref (prevents double-submit)
    if (isSubmittingRef.current) {
      console.warn('⚠️ Submit already in progress, ignoring duplicate click');
      return;
    }

    setSubmitError(null);

    if (!validate()) {
      return;
    }

    // Confirmation dialog
    const action = 'create'; // This form is create-only (no edit mode)
    if (!confirm(`Are you sure you want to ${action} this custom campaign?`)) {
      return;
    }

    // CRITICAL-5 FIX: Set ref immediately (synchronous)
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // CRITICAL-3 FIX: Convert date filters to UTC ISO strings
      const createdAfterUTC = createdAfter
        ? new Date(createdAfter + 'T00:00:00').toISOString()
        : null;
      const createdBeforeUTC = createdBefore
        ? new Date(createdBefore + 'T23:59:59').toISOString()
        : null;

      // CRITICAL-3 FIX: Convert scheduled datetime to UTC
      const startDatetimeUTC = isScheduled && startDatetime
        ? convertLocalToUTC(startDatetime)
        : null;

      const payload = {
        clientId,
        name,
        targetTags: selectedTags,
        createdAfter: createdAfterUTC,
        createdBefore: createdBeforeUTC,
        minIcpScore: minIcpScore > 0 ? minIcpScore : null,
        maxIcpScore: maxIcpScore < 100 ? maxIcpScore : null,
        engagementLevels: engagementLevels.length < 3 ? engagementLevels : null,
        messages,
        isPaused,
        startDatetime: startDatetimeUTC,
        maxLeadsToEnroll: maxLeadsToEnroll || null,
        resourceLink: resourceLink.trim() || null,
        resourceName: resourceName.trim() || null,
        bookingLink: bookingLink.trim() || null,
        excludeBooked: true,
        excludeSmsStop: true,
        excludeInActiveCampaign: true,
      };

      const response = await fetch('/api/admin/campaigns/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      // HIGH-7 FIX: Reset unsaved changes flag on success
      setHasUnsavedChanges(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      setSubmitError(error.message || 'Failed to create campaign');
    } finally {
      // CRITICAL-5 FIX: Reset ref to allow future submissions
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // HIGH-7 FIX: Handle close with unsaved changes confirmation
  const handleClose = () => {
    if (hasUnsavedChanges && !isSubmitting) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  const getPreviewFilters = () => {
    // CRITICAL-3 FIX: Convert date filters to UTC for preview
    const createdAfterUTC = createdAfter
      ? new Date(createdAfter + 'T00:00:00').toISOString()
      : null;
    const createdBeforeUTC = createdBefore
      ? new Date(createdBefore + 'T23:59:59').toISOString()
      : null;

    return {
      targetTags: selectedTags,
      createdAfter: createdAfterUTC,
      createdBefore: createdBeforeUTC,
      minIcpScore: minIcpScore > 0 ? minIcpScore : null,
      maxIcpScore: maxIcpScore < 100 ? maxIcpScore : null,
      engagementLevels: engagementLevels.length < 3 ? engagementLevels : null,
      excludeBooked: true,
      excludeSmsStop: true,
      excludeInActiveCampaign: true,
    };
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
            <h2 className={`text-2xl font-bold ${theme.core.white}`}>
              {mode === 'leadForm' ? 'Create Lead Form Campaign' : 'Create Nurture Campaign'}
            </h2>
            <button
              onClick={handleClose}
              className={`${theme.core.bodyText} hover:text-white transition`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* CRITICAL-1 FIX: Migration Status Check */}
            {checkingMigration ? (
              <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  <p className="text-blue-300 font-semibold">
                    Verifying database migration status...
                  </p>
                </div>
              </div>
            ) : !migrationExecuted ? (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-300 font-bold text-lg mb-2">
                      Database Migration Required
                    </h3>
                    <p className="text-red-300 text-sm mb-4">
                      {migrationError}
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={checkMigrationStatus}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
                      >
                        Retry Check
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Error Banner */}
            {submitError && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
                {submitError}
              </div>
            )}

            {/* CRITICAL-1 FIX: Only render form if migration executed */}
            {migrationExecuted && (
              <>
                {/* ================================================================ */}
                {/* SECTION 1: LEAD TARGETING CRITERIA */}
                {/* ================================================================ */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-cyan-500/30">
                    <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
                    <h3 className={`text-xl font-bold ${theme.accents.primary.class}`}>
                      Lead Targeting Criteria
                    </h3>
                  </div>
                  <p className={`text-sm ${theme.core.bodyText} -mt-2`}>
                    Define which leads will be enrolled in this campaign
                  </p>

                  {/* Campaign Name */}
                  <div>
                    <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                      Campaign Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`${theme.components.input} w-full ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="e.g., Q1 2025 Re-engagement"
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>

                  {/* Target Tags */}
                  <div>
              <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                {mode === 'leadForm' ? 'Lead Form Tag' : 'Target Tags'} <span className="text-red-400">*</span>
              </label>
              {mode === 'leadForm' && (
                <p className={`text-xs ${theme.core.bodyText} mb-2`}>
                  Select the tag associated with your Kajabi form. Campaign name will auto-populate.
                </p>
              )}
              {loadingTags ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading tags from cache...</span>
                </div>
              ) : availableTags.length === 0 ? (
                <div className="space-y-3">
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                    <p className="text-yellow-300 text-sm font-semibold mb-2">
                      No tags in cache
                    </p>
                    <p className="text-yellow-300 text-xs mb-3">
                      Tags are auto-discovered daily. Try loading directly from database or enter manually.
                    </p>
                    {/* CRITICAL-2 FIX: Direct database load */}
                    <button
                      type="button"
                      onClick={fetchTagsDirectly}
                      disabled={loadingDirectTags}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    >
                      {loadingDirectTags ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading from Database...
                        </>
                      ) : (
                        'Load Tags from Database'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          selectedTags.includes(tag)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CRITICAL-2 FIX: Manual Tag Entry */}
              <div className="mt-3 space-y-2">
                {!showManualEntry ? (
                  <button
                    type="button"
                    onClick={() => setShowManualEntry(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                  >
                    + Add tag manually
                  </button>
                ) : (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                    <label className="text-xs text-gray-400 block mb-1">
                      Manual Tag Entry
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualTagInput}
                        onChange={(e) => setManualTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addManualTag();
                          }
                        }}
                        placeholder="e.g., webinar-2025-q1"
                        className={`${theme.components.input} flex-1 text-sm ${errors.manualTag ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={addManualTag}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualEntry(false);
                          setManualTagInput('');
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.manualTag;
                            return newErrors;
                          });
                        }}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    {errors.manualTag && (
                      <p className="text-red-400 text-xs mt-1">{errors.manualTag}</p>
                    )}
                  </div>
                )}
              </div>

              {errors.targetTags && <p className="text-red-400 text-sm mt-1">{errors.targetTags}</p>}
              {errors.tags && <p className="text-yellow-400 text-sm mt-1">{errors.tags}</p>}

              {/* CRITICAL-2 FIX: Selection count with warning */}
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${selectedTags.length >= MAX_TAG_SELECTION ? 'text-orange-400 font-semibold' : theme.core.bodyText}`}>
                  Selected: {selectedTags.length} / {MAX_TAG_SELECTION} tag{selectedTags.length !== 1 ? 's' : ''}
                </p>
                {selectedTags.length >= MAX_TAG_SELECTION && (
                  <p className="text-xs text-orange-400">
                    Maximum reached
                  </p>
                )}
              </div>
            </div>

            {/* Advanced Filters (Nurture mode only) */}
            {mode === 'nurture' && (
              <>
                {/* Lead Date Range */}
                <div>
                  <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                    Lead Date Range (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">From</label>
                      <input
                        type="date"
                        value={createdAfter}
                        onChange={(e) => setCreatedAfter(e.target.value)}
                        className={`${theme.components.input} w-full`}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">To</label>
                      <input
                        type="date"
                        value={createdBefore}
                        onChange={(e) => setCreatedBefore(e.target.value)}
                        className={`${theme.components.input} w-full`}
                      />
                    </div>
                  </div>
                </div>

                {/* ICP Score Range */}
                <div>
                  <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                    ICP Score Range: {minIcpScore} - {maxIcpScore}
                  </label>
                  <div className="px-2 pt-2 pb-6">
                    <Slider
                      range
                      min={0}
                      max={100}
                      step={5}
                      value={[minIcpScore, maxIcpScore]}
                      onChange={(values) => {
                        if (Array.isArray(values)) {
                          setMinIcpScore(values[0]);
                          setMaxIcpScore(values[1]);
                        }
                      }}
                      trackStyle={[{ backgroundColor: '#06b6d4', height: 6 }]}
                      handleStyle={[
                        { borderColor: '#06b6d4', backgroundColor: '#06b6d4', height: 20, width: 20, marginTop: -7 },
                        { borderColor: '#06b6d4', backgroundColor: '#06b6d4', height: 20, width: 20, marginTop: -7 }
                      ]}
                      railStyle={{ backgroundColor: '#374151', height: 6 }}
                    />
                  </div>
                  {errors.icpScore && <p className="text-red-400 text-sm mt-1">{errors.icpScore}</p>}
                </div>

                {/* Engagement Levels */}
                <div>
                  <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                    Engagement Levels
                  </label>
                  <div className="flex gap-3">
                    {['High', 'Medium', 'Low'].map((level) => (
                      <label key={level} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={engagementLevels.includes(level)}
                          onChange={() => toggleEngagementLevel(level)}
                          className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <span className={`text-sm ${theme.core.bodyText}`}>{level}</span>
                      </label>
                    ))}
                  </div>
                  {errors.engagementLevels && (
                    <p className="text-yellow-400 text-xs mt-2">{errors.engagementLevels}</p>
                  )}
                  {engagementLevels.length === 1 && !errors.engagementLevels && (
                    <p className="text-yellow-400 text-xs mt-2">
                      ⚠️ At least one engagement level must remain selected
                    </p>
                  )}
                </div>
              </>
            )}
                </div>
                {/* END SECTION 1 */}

                {/* ================================================================ */}
                {/* SECTION 2: CAMPAIGN CONTENT & MESSAGES */}
                {/* ================================================================ */}
                <div className="space-y-6 pt-8 border-t-2 border-gray-700">
                  <div className="flex items-center gap-3 pb-4 border-b border-purple-500/30">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                    <h3 className={`text-xl font-bold text-purple-400`}>
                      Campaign Content & Messages
                    </h3>
                  </div>
                  <p className={`text-sm ${theme.core.bodyText} -mt-2`}>
                    Configure campaign messaging, resources, and booking links
                  </p>

                  {/* Resource Links (Optional) - Available for both modes */}
                  <div className="space-y-4">
                    <h4 className={`text-md font-bold ${theme.accents.tertiary.class}`}>
                      Resource Links (Optional)
                    </h4>
                    <p className={`text-xs ${theme.core.bodyText} -mt-2`}>
                      Share a resource document, recording, or other material with leads in this campaign
                    </p>

                    <div>
                      <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                        Resource Link
                      </label>
                      <input
                        type="url"
                        value={resourceLink}
                        onChange={(e) => setResourceLink(e.target.value)}
                        onBlur={validateResourceFields}
                        className={`${theme.components.input} w-full ${errors.resourceLink ? 'border-red-500' : ''}`}
                        placeholder="https://example.com/resource"
                      />
                      {errors.resourceLink && (
                        <p className="text-red-400 text-sm mt-1">{errors.resourceLink}</p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                        Resource Name
                      </label>
                      <input
                        type="text"
                        value={resourceName}
                        onChange={(e) => setResourceName(e.target.value)}
                        onBlur={validateResourceFields}
                        className={`${theme.components.input} w-full ${errors.resourceName ? 'border-red-500' : ''}`}
                        placeholder="e.g., Download Guide, Course Materials"
                      />
                      {errors.resourceName && (
                        <p className="text-red-400 text-sm mt-1">{errors.resourceName}</p>
                      )}
                      <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                        Friendly name for the resource (shown to leads)
                      </p>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                        Booking/Calendly Link
                      </label>
                      <input
                        type="url"
                        value={bookingLink}
                        onChange={(e) => setBookingLink(e.target.value)}
                        className={`${theme.components.input} w-full ${errors.bookingLink ? 'border-red-500' : ''}`}
                        placeholder="https://calendly.com/..."
                      />
                      <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                        This link will be included in AI-generated messages. Defaults to UYSP link.
                      </p>
                      {errors.bookingLink && (
                        <p className="text-red-400 text-sm mt-1">{errors.bookingLink}</p>
                      )}
                    </div>
                  </div>

                  {/* Messages Section */}
                  <div className="space-y-4 pt-6 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-md font-bold ${theme.accents.tertiary.class}`}>
                        Message Sequence
                      </h4>
                {messages.length < 3 && (
                  <button
                    type="button"
                    onClick={addMessage}
                    className="flex items-center gap-1 text-sm font-semibold text-green-400 hover:text-green-300"
                  >
                    <Plus className="h-4 w-4" />
                    Add Message
                  </button>
                )}
              </div>

              {messages.map((message, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold ${theme.core.white}`}>
                      Message {index + 1}
                    </h4>
                    <div className="flex items-center gap-2">
                      {messages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMessage(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delay (not shown for first message) */}
                  {index > 0 && (
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        Delay (days) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={Math.round((message.delayMinutes / 1440) * 10) / 10}
                        onChange={(e) => {
                          const days = Number(e.target.value);
                          const minutes = Math.round(days * 1440);
                          updateMessage(index, 'delayMinutes', minutes);
                        }}
                        className={`${theme.components.input} w-32 ${errors[`message_${index}_delay`] ? 'border-red-500' : ''}`}
                        placeholder="1"
                      />
                      {errors[`message_${index}_delay`] && (
                        <p className="text-red-400 text-xs mt-1">{errors[`message_${index}_delay`]}</p>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-400">
                        Message Text <span className="text-red-400">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {/* CRITICAL-4 FIX: Show Retry button if AI error */}
                        {errors[`ai_${index}`] && !generatingMessage && (
                          <button
                            type="button"
                            onClick={() => generateMessage(index, true)}
                            className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300"
                          >
                            <Sparkles className="h-3 w-3" />
                            Retry
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => generateMessage(index)}
                          disabled={generatingMessage === index}
                          className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 disabled:opacity-50"
                        >
                          {generatingMessage === index ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              AI Generate
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CRITICAL-4 FIX: Show AI error messages */}
                    {errors[`ai_${index}`] && (
                      <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/50 rounded text-yellow-300 text-xs">
                        {errors[`ai_${index}`]}
                      </div>
                    )}

                    {/* NEW: Variable Insertion Buttons */}
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="text-xs text-gray-400 self-center">Insert:</span>
                      <button
                        type="button"
                        onClick={() => insertVariable(index, '{{first_name}}')}
                        className="px-2 py-1 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-600/40 rounded font-mono"
                        title="Insert {{first_name}} at cursor"
                      >
                        + First Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable(index, '{{company}}')}
                        className="px-2 py-1 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-600/40 rounded font-mono"
                        title="Insert {{company}} at cursor"
                      >
                        + Company
                      </button>
                      {resourceLink && resourceName && (
                        <>
                          <button
                            type="button"
                            onClick={() => insertVariable(index, '{{resource_name}}')}
                            className="px-2 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/40 rounded font-mono"
                            title="Insert {{resource_name}} at cursor"
                          >
                            + Resource Name
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => insertVariable(index, '{{resource_link}}')}
                        className="px-2 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/40 rounded font-mono"
                        title="Insert {{resource_link}} at cursor"
                      >
                        + Resource Link
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable(index, '{{booking_link}}')}
                        className="px-2 py-1 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-600/40 rounded font-mono"
                        title="Insert {{booking_link}} at cursor"
                      >
                        + Booking Link
                      </button>
                    </div>

                    <textarea
                      ref={(el) => { messageTextareaRefs.current[index] = el; }}
                      value={message.text}
                      onChange={(e) => updateMessage(index, 'text', e.target.value)}
                      onPaste={(e) => {
                        // HIGH-4 FIX: Warn on paste if exceeding character limit
                        const pastedText = e.clipboardData.getData('text');
                        const currentText = message.text;
                        const newLength = currentText.length + pastedText.length;

                        if (newLength > 1600) {
                          const willBeTruncated = newLength - 1600;
                          setErrors((prev) => ({
                            ...prev,
                            [`message_${index}_paste`]: `⚠️ Pasted text is too long. ${willBeTruncated} characters will be truncated.`,
                          }));

                          // Clear warning after 5 seconds
                          setTimeout(() => {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[`message_${index}_paste`];
                              return newErrors;
                            });
                          }, 5000);
                        }
                      }}
                      rows={4}
                      maxLength={1600}
                      className={`${theme.components.input} w-full resize-none ${errors[`message_${index}`] ? 'border-red-500' : ''}`}
                      placeholder="Hey {{first_name}}, I wanted to reach out..."
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors[`message_${index}`] && (
                        <p className="text-red-400 text-xs">{errors[`message_${index}`]}</p>
                      )}
                      <p className={`text-xs ${message.text.length > 1600 ? 'text-red-400' : theme.core.bodyText} ml-auto`}>
                        {message.text.length} / 1600 characters
                      </p>
                    </div>
                    {/* HIGH-4 FIX: Show paste warning */}
                    {errors[`message_${index}_paste`] && (
                      <p className="text-orange-400 text-xs mt-1">{errors[`message_${index}_paste`]}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Variables: <code className="text-cyan-300">{'{{first_name}}'}</code>,
                      <code className="text-cyan-300 ml-1">{'{{company}}'}</code>,
                      {resourceLink && resourceName && (
                        <>
                          <code className="text-purple-300 ml-1">{'{{resource_name}}'}</code>,
                        </>
                      )}
                      <code className="text-purple-300 ml-1">{'{{resource_link}}'}</code>,
                      <code className="text-green-300 ml-1">{'{{booking_link}}'}</code>
                    </p>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
                {/* END SECTION 2 */}

                {/* ================================================================ */}
                {/* SECTION 3: CAMPAIGN SETTINGS */}
                {/* ================================================================ */}
                <div className="space-y-4 pt-8 border-t-2 border-gray-700">
                  <h3 className={`text-lg font-bold ${theme.accents.tertiary.class}`}>
                    Campaign Settings
                  </h3>

              {/* Schedule Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <div>
                  <label className={`block text-sm font-semibold ${theme.core.white}`}>
                    Schedule for Later
                  </label>
                  <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                    {isScheduled ? 'Campaign will activate at scheduled time' : 'Campaign will start immediately'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    isScheduled ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isScheduled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Start Datetime (shown if scheduled) */}
              {isScheduled && (
                <div>
                  <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                    Start Datetime <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startDatetime}
                    onChange={(e) => setStartDatetime(e.target.value)}
                    className={`${theme.components.input} w-full ${errors.startDatetime ? 'border-red-500' : ''}`}
                  />
                  {/* CRITICAL-3 FIX: Show user's timezone */}
                  <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                    Your timezone: {getUserTimezone()}
                  </p>
                  {errors.startDatetime && <p className="text-red-400 text-sm mt-1">{errors.startDatetime}</p>}
                </div>
              )}

              {/* Pause Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <div>
                  <label className={`block text-sm font-semibold ${theme.core.white}`}>
                    Start Paused
                  </label>
                  <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                    {isPaused ? 'Campaign will be created in paused state' : 'Campaign will be active'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    isPaused ? 'bg-gray-600' : 'bg-green-500'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isPaused ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
              </div>

              {/* Max Leads Cap */}
              <div>
                <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                  Max Leads to Enroll (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxLeadsToEnroll || ''}
                  onChange={(e) => setMaxLeadsToEnroll(e.target.value ? Number(e.target.value) : null)}
                  className={`${theme.components.input} w-full`}
                  placeholder="Leave empty for no limit"
                />
                <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                  Limit the number of leads enrolled in this campaign
                </p>
              </div>
                </div>
                {/* END SECTION 3 */}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t-2 border-gray-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold ${theme.core.bodyText} bg-gray-700 hover:bg-gray-600 transition`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTags.length === 0) {
                        setErrors({ targetTags: 'Select at least one tag to preview' });
                        return;
                      }
                      setShowPreviewModal(true);
                    }}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="h-5 w-5" />
                    Preview Leads
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition ${
                      isSubmitting
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Lead Preview Modal */}
      {showPreviewModal && (
        <LeadPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          filters={getPreviewFilters()}
          clientId={clientId}
        />
      )}
    </>
  );
}
