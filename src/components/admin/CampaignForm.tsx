'use client';
// CACHE BUST: 2025-11-05T01:30:00Z - Force recompile for variable insertion UI

import { useState, useEffect, useRef } from 'react';
import { theme } from '@/theme';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  stage: 'thank_you' | 'value_add' | '24h_reminder' | '1h_reminder';
  label: string;
  delayMinutes: number;
  text: string;
}

interface Campaign {
  id?: string;
  clientId?: string;
  name: string;
  campaignType: 'Webinar' | 'Standard';
  formId: string;
  isPaused: boolean;
  webinarDatetime?: string | null;
  zoomLink?: string | null;
  resourceLink?: string | null;
  resourceName?: string | null;
  bookingLink?: string | null;
}

interface CampaignFormProps {
  campaign?: Campaign | null;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialCampaignType?: 'Webinar' | 'Standard';
}

export default function CampaignForm({
  campaign,
  clientId,
  onClose,
  onSuccess,
  initialCampaignType = 'Standard',
}: CampaignFormProps) {
  const isEditing = Boolean(campaign?.id);

  const [formData, setFormData] = useState<Campaign>({
    name: campaign?.name || '',
    campaignType: 'Webinar', // Always webinar
    formId: campaign?.formId || '',
    isPaused: campaign?.isPaused ?? false,
    webinarDatetime: campaign?.webinarDatetime || null,
    zoomLink: campaign?.zoomLink || null,
    resourceLink: campaign?.resourceLink || null,
    resourceName: campaign?.resourceName || null,
    bookingLink: campaign?.bookingLink || 'https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr', // Default UYSP link
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState<number | null>(null);

  // Tag selection state
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>(campaign?.formId || '');
  const [loadingTags, setLoadingTags] = useState(false);

  // Webinar-specific message sequence (4 stages)
  const [messages, setMessages] = useState<Message[]>([
    { stage: 'thank_you', label: 'Thank You & Calendar Invite', delayMinutes: 0, text: '' },
    { stage: 'value_add', label: 'Value Add Resource', delayMinutes: 1440, text: '' }, // 1 day
    { stage: '24h_reminder', label: '24-Hour Reminder', delayMinutes: 2880, text: '' }, // 2 days (will be dynamic based on webinar date)
    { stage: '1h_reminder', label: '1-Hour Reminder', delayMinutes: 4260, text: '' }, // ~3 days (will be dynamic based on webinar date)
  ]);

  // NEW: Refs for message textareas to enable cursor-position variable insertion
  const messageTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Fetch available tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoadingTags(true);
        const response = await fetch(`/api/admin/campaigns/available-tags?clientId=${clientId}&direct=true`);
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoadingTags(false);
      }
    };
    fetchTags();
  }, [clientId]);

  // When tag is selected, update formId and auto-generate name
  useEffect(() => {
    if (selectedTag && !isEditing) {
      setFormData((prev) => ({
        ...prev,
        formId: selectedTag,
        name: prev.name || tagToFriendlyName(selectedTag),
      }));
    }
  }, [selectedTag, isEditing]);

  // Helper to convert tag to friendly name
  const tagToFriendlyName = (tag: string): string => {
    return tag
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!selectedTag.trim()) {
      newErrors.tag = 'Webinar tag is required';
    }

    // Webinar-specific validation
    if (formData.campaignType === 'Webinar') {
      if (!formData.isPaused) {
        if (!formData.webinarDatetime) {
          newErrors.webinarDatetime = 'Webinar datetime is required for active webinar campaigns';
        } else {
          const datetime = new Date(formData.webinarDatetime);
          if (datetime < new Date()) {
            newErrors.webinarDatetime = 'Webinar datetime must be in the future';
          }
        }

        if (!formData.zoomLink) {
          newErrors.zoomLink = 'Zoom link is required for active webinar campaigns';
        }
      }

      // Validate URL formats
      if (formData.zoomLink && !isValidUrl(formData.zoomLink)) {
        newErrors.zoomLink = 'Zoom link must be a valid URL';
      }
      if (formData.resourceLink && !isValidUrl(formData.resourceLink)) {
        newErrors.resourceLink = 'Resource link must be a valid URL';
      }
      if (formData.bookingLink && !isValidUrl(formData.bookingLink)) {
        newErrors.bookingLink = 'Booking link must be a valid URL';
      }

      // Validate webinar messages
      messages.forEach((msg, idx) => {
        if (!msg.text.trim()) {
          newErrors[`message_${idx}`] = `${msg.label} message is required`;
        } else if (msg.text.length > 1600) {
          newErrors[`message_${idx}`] = 'Message exceeds 1600 character SMS limit';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const updateMessage = (index: number, text: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text };
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
    updateMessage(messageIndex, newText);
    
    // Set cursor position after variable
    setTimeout(() => {
      textareaRef.focus();
      const newCursorPos = start + variable.length;
      textareaRef.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // AI generation for webinar messages
  const generateMessage = async (index: number) => {
    try {
      setGeneratingMessage(index);
      const message = messages[index];

      // Build context for AI
      const webinarContext = {
        campaignName: formData.name || 'Webinar',
        webinarDatetime: formData.webinarDatetime,
        zoomLink: formData.zoomLink,
        resourceLink: formData.resourceLink,
        resourceName: formData.resourceName,
        stage: message.stage,
      };

      // Create stage-specific prompt - map to valid messageGoal enum values
      let messageGoal: 'book_call' | 'provide_value' | 'nurture' | 'follow_up' = 'provide_value';
      let stageInstructions = '';
      let bookingLink = '';

      switch (message.stage) {
        case 'thank_you':
          messageGoal = 'nurture';
          stageInstructions = 'Include confirmation that they\'re registered and will receive calendar invite. Keep it warm and welcoming.';
          bookingLink = formData.zoomLink || '';
          break;
        case 'value_add':
          messageGoal = 'provide_value';
          stageInstructions = formData.resourceLink
            ? `Share the resource: "${formData.resourceName || 'resource'}". Make it valuable and relevant to preparing for the webinar.`
            : 'Share valuable pre-webinar content or tips. Make them excited about the upcoming session.';
          break;
        case '24h_reminder':
          messageGoal = 'follow_up';
          stageInstructions = 'Remind them about the webinar happening in 24 hours. Build anticipation and excitement.';
          break;
        case '1h_reminder':
          messageGoal = 'follow_up';
          stageInstructions = 'Final reminder - webinar starting in 1 hour. Include clear call-to-action to join. Create urgency.';
          bookingLink = formData.zoomLink || '';
          break;
      }

      // Combine context into customInstructions
      const webinarDetails = `Webinar: ${formData.name || 'Webinar Campaign'}. Date/Time: ${formData.webinarDatetime || 'TBD'}. Stage: ${message.stage}.`;
      const customInstructions = `${webinarDetails} ${stageInstructions}`;

      const response = await fetch('/api/admin/campaigns/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: formData.name || 'Webinar Campaign',
          targetAudience: 'Webinar registrants',
          messageGoal,
          tone: 'friendly',
          includeLink: message.stage === 'thank_you' || message.stage === '1h_reminder',
          bookingLink: bookingLink || undefined,
          customInstructions,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        updateMessage(index, data.message);
      } else if (response.status === 429) {
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
      setErrors((prev) => ({
        ...prev,
        [`ai_${index}`]: `Network error: ${error.message || 'Failed to generate'}`,
      }));
    } finally {
      setGeneratingMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        clientId,
        // Include messages for webinar campaigns
        ...(formData.campaignType === 'Webinar' ? { messages } : {}),
      };

      const url = isEditing
        ? `/api/admin/campaigns/${campaign!.id}`
        : '/api/admin/campaigns';

      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save campaign');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      setSubmitError(error.message || 'Failed to save campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof Campaign, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className={`text-2xl font-bold ${theme.core.white}`}>
            {isEditing ? 'Edit Webinar Campaign' : 'Create Webinar Campaign'}
          </h2>
          <button
            onClick={onClose}
            className={`${theme.core.bodyText} hover:text-white transition`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Banner */}
          {submitError && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
              {submitError}
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
              Campaign Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`${theme.components.input} w-full ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g., 2025 Q1 Webinar"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Webinar Tag Selector */}
          <div>
            <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
              Webinar Tag <span className="text-red-400">*</span>
            </label>
            {loadingTags ? (
              <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                <span className={theme.core.bodyText}>Loading webinar tags...</span>
              </div>
            ) : (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className={`${theme.components.input} w-full ${errors.tag ? 'border-red-500' : ''}`}
                disabled={isEditing}
              >
                <option value="">-- Select a webinar tag --</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}
            {errors.tag && <p className="text-red-400 text-sm mt-1">{errors.tag}</p>}
            <p className={`text-xs ${theme.core.bodyText} mt-1`}>
              Select the Kajabi tag for this webinar registration form
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <label className={`block text-sm font-semibold ${theme.core.white}`}>
                Campaign Status
              </label>
              <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                {formData.isPaused ? 'Campaign is paused (inactive)' : 'Campaign is active'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('isPaused', !formData.isPaused)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                formData.isPaused ? 'bg-gray-600' : 'bg-green-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  formData.isPaused ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
          </div>

          {/* Webinar Details */}
          <div className="space-y-6 pt-6 border-t border-gray-700">
            <h3 className={`text-lg font-bold ${theme.accents.tertiary.class}`}>
              Webinar Details
            </h3>

              {/* Webinar Datetime */}
              <div>
                <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                  Webinar Datetime {!formData.isPaused && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="datetime-local"
                  value={formData.webinarDatetime || ''}
                  onChange={(e) => handleChange('webinarDatetime', e.target.value || null)}
                  className={`${theme.components.input} w-full ${errors.webinarDatetime ? 'border-red-500' : ''}`}
                />
                {errors.webinarDatetime && (
                  <p className="text-red-400 text-sm mt-1">{errors.webinarDatetime}</p>
                )}
              </div>

              {/* Zoom Link */}
              <div>
                <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                  Zoom Link {!formData.isPaused && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="url"
                  value={formData.zoomLink || ''}
                  onChange={(e) => handleChange('zoomLink', e.target.value || null)}
                  className={`${theme.components.input} w-full ${errors.zoomLink ? 'border-red-500' : ''}`}
                  placeholder="https://zoom.us/j/..."
                />
                {errors.zoomLink && <p className="text-red-400 text-sm mt-1">{errors.zoomLink}</p>}
              </div>

              {/* Resource Link */}
              <div>
                <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                  Resource Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.resourceLink || ''}
                  onChange={(e) => handleChange('resourceLink', e.target.value || null)}
                  className={`${theme.components.input} w-full ${errors.resourceLink ? 'border-red-500' : ''}`}
                  placeholder="https://example.com/resource"
                />
                {errors.resourceLink && (
                  <p className="text-red-400 text-sm mt-1">{errors.resourceLink}</p>
                )}
              </div>

              {/* Resource Name */}
              <div>
                <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                  Resource Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.resourceName || ''}
                  onChange={(e) => handleChange('resourceName', e.target.value || null)}
                  className={`${theme.components.input} w-full`}
                  placeholder="e.g., Webinar Slides"
                />
              </div>

              {/* Booking Link */}
              <div>
                <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                  Booking/Calendly Link
                </label>
                <input
                  type="url"
                  value={formData.bookingLink || ''}
                  onChange={(e) => handleChange('bookingLink', e.target.value || null)}
                  className={`${theme.components.input} w-full ${errors.bookingLink ? 'border-red-500' : ''}`}
                  placeholder="https://calendly.com/..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  This link will be included in AI-generated messages. Defaults to UYSP link.
                </p>
                {errors.bookingLink && (
                  <p className="text-red-400 text-sm mt-1">{errors.bookingLink}</p>
                )}
              </div>

              {/* Message Sequence */}
              <div className="space-y-4 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${theme.accents.tertiary.class}`}>
                    Message Sequence
                  </h3>
                  <p className={`text-xs ${theme.core.bodyText}`}>
                    4 automated messages for your webinar flow
                  </p>
                </div>

                {messages.map((message, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${theme.core.white}`}>
                        {index + 1}. {message.label}
                      </h4>
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

                    {/* AI Error Messages */}
                    {errors[`ai_${index}`] && (
                      <div className="p-2 bg-yellow-500/10 border border-yellow-500/50 rounded text-yellow-300 text-xs">
                        {errors[`ai_${index}`]}
                      </div>
                    )}

                    {/* Message Text */}
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Message Text <span className="text-red-400">*</span>
                      </label>

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
                        {formData.resourceLink && formData.resourceName && (
                          <>
                            <button
                              type="button"
                              onClick={() => insertVariable(index, '{{resource_name}}')}
                              className="px-2 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/40 rounded font-mono"
                              title="Insert {{resource_name}} at cursor"
                            >
                              + Resource Name
                            </button>
                            <button
                              type="button"
                              onClick={() => insertVariable(index, '{{resource_link}}')}
                              className="px-2 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/40 rounded font-mono"
                              title="Insert {{resource_link}} at cursor"
                            >
                              + Resource Link
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => insertVariable(index, '{{zoom_link}}')}
                          className="px-2 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-600/40 rounded font-mono"
                          title="Insert {{zoom_link}} at cursor"
                        >
                          + Zoom Link
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
                        ref={(el) => (messageTextareaRefs.current[index] = el)}
                        value={message.text}
                        onChange={(e) => updateMessage(index, e.target.value)}
                        rows={4}
                        maxLength={1600}
                        className={`${theme.components.input} w-full resize-none ${errors[`message_${index}`] ? 'border-red-500' : ''}`}
                        placeholder={`Enter ${message.label.toLowerCase()} message...`}
                      />
                      <div className="flex items-center justify-between mt-1">
                        {errors[`message_${index}`] && (
                          <p className="text-red-400 text-xs">{errors[`message_${index}`]}</p>
                        )}
                        <p className={`text-xs ${message.text.length > 1600 ? 'text-red-400' : theme.core.bodyText} ml-auto`}>
                          {message.text.length} / 1600 characters
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Variables: <code className="text-cyan-300">{{'{{'}}first_name{{'}}'}}</code>, 
                        {formData.resourceLink && formData.resourceName && (
                          <>
                            <code className="text-purple-300 ml-1">{{'{{'}}resource_name{{'}}'}}</code>, 
                            <code className="text-purple-300 ml-1">{{'{{'}}resource_link{{'}}'}}</code>, 
                          </>
                        )}
                        <code className="text-blue-300 ml-1">{{'{{'}}zoom_link{{'}}'}}</code>, 
                        <code className="text-green-300 ml-1">{{'{{'}}booking_link{{'}}'}}</code>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold ${theme.core.bodyText} bg-gray-700 hover:bg-gray-600 transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition ${
                isSubmitting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : `${theme.accents.primary.bgClass} hover:bg-green-600`
              }`}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
