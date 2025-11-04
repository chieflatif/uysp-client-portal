'use client';

import { useState, useEffect } from 'react';
import { theme } from '@/theme';
import { X } from 'lucide-react';

interface Campaign {
  id?: string;
  clientId?: string;
  name: string;
  campaignType: 'Webinar' | 'Standard' | 'Custom';
  formId: string;
  isPaused: boolean;
  webinarDatetime?: string | null;
  zoomLink?: string | null;
  resourceLink?: string | null;
  resourceName?: string | null;
}

interface CampaignFormProps {
  campaign?: Campaign | null;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CampaignForm({
  campaign,
  clientId,
  onClose,
  onSuccess,
}: CampaignFormProps) {
  const isEditing = Boolean(campaign?.id);

  const [formData, setFormData] = useState<Campaign>({
    name: campaign?.name || '',
    campaignType: campaign?.campaignType || 'Standard',
    formId: campaign?.formId || '',
    isPaused: campaign?.isPaused ?? false,
    webinarDatetime: campaign?.webinarDatetime || null,
    zoomLink: campaign?.zoomLink || null,
    resourceLink: campaign?.resourceLink || null,
    resourceName: campaign?.resourceName || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData.formId.trim()) {
      newErrors.formId = 'Form ID is required';
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

  // When campaign type changes, clear webinar-specific fields if switching to Standard
  useEffect(() => {
    if (formData.campaignType === 'Standard') {
      setFormData((prev) => ({
        ...prev,
        webinarDatetime: null,
        zoomLink: null,
        resourceLink: null,
        resourceName: null,
      }));
    }
  }, [formData.campaignType]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className={`text-2xl font-bold ${theme.core.white}`}>
            {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
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

          {/* Campaign Type */}
          <div>
            <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
              Campaign Type <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleChange('campaignType', 'Standard')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition ${
                  formData.campaignType === 'Standard'
                    ? `${theme.accents.primary.bgClass} text-white border-green-500`
                    : `bg-gray-700 ${theme.core.bodyText} border-gray-600 hover:border-gray-500`
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => handleChange('campaignType', 'Webinar')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition ${
                  formData.campaignType === 'Webinar'
                    ? `bg-purple-600 text-white border-purple-500`
                    : `bg-gray-700 ${theme.core.bodyText} border-gray-600 hover:border-gray-500`
                }`}
              >
                Webinar
              </button>
            </div>
          </div>

          {/* Form ID */}
          <div>
            <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
              Form ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.formId}
              onChange={(e) => handleChange('formId', e.target.value)}
              className={`${theme.components.input} w-full ${errors.formId ? 'border-red-500' : ''}`}
              placeholder="e.g., form_abc123"
            />
            {errors.formId && <p className="text-red-400 text-sm mt-1">{errors.formId}</p>}
            <p className={`text-xs ${theme.core.bodyText} mt-1`}>
              Unique identifier for the form (e.g., Kajabi form ID)
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

          {/* Webinar-Specific Fields */}
          {formData.campaignType === 'Webinar' && (
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
            </div>
          )}

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
