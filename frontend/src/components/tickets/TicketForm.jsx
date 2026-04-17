import React, { useEffect, useMemo, useState } from 'react';
import { createTicket } from '../../api/ticketApi';
import { TICKET_CATEGORY, TICKET_PRIORITY } from '../../utils/ticketConstants';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const TicketForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [resourceSearch, setResourceSearch] = useState('');

  const [formData, setFormData] = useState({
    resourceId: '',
    category: '',
    description: '',
    priority: '',
    contactEmail: '',
    contactPhone: ''
  });

  const [attachments, setAttachments] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        contactEmail: prev.contactEmail || user.email
      }));
    }
  }, [user]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    const fetchResources = async () => {
      setLoadingResources(true);
      try {
        const { data } = await api.get('/api/resources');
        setResources(data.filter((resource) => resource.status === 'ACTIVE'));
      } catch (err) {
        console.error('Failed to load resources:', err);
        setError('Failed to load resources');
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, []);

  const selectedResource = useMemo(
    () => resources.find((resource) => String(resource.id) === String(formData.resourceId)),
    [resources, formData.resourceId]
  );
  const descriptionLength = formData.description.trim().length;
  const stepConfig = [
    { id: 1, label: 'Choose Resource' },
    { id: 2, label: 'Issue Details' },
    { id: 3, label: 'Contact & Attachments' }
  ];

  const filteredResources = useMemo(() => {
    const query = resourceSearch.trim().toLowerCase();
    if (!query) return resources;

    return resources.filter((resource) =>
      resource.name?.toLowerCase().includes(query) ||
      resource.location?.toLowerCase().includes(query) ||
      resource.type?.toLowerCase().includes(query) ||
      String(resource.id).includes(query)
    );
  }, [resources, resourceSearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contactPhone') {
      setPhoneError('');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResourceSelect = (resourceId) => {
    setFormData((prev) => ({
      ...prev,
      resourceId: String(resourceId)
    }));
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return true;
    return /^(07\d{8}|011\d{7})$/.test(phone);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 3) {
      setError('Maximum 3 attachments allowed');
      return;
    }

    const oversizedFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Each file must be less than 10MB');
      return;
    }

    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setAttachments(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
    setError('');
  };

  const removeAttachment = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);

    URL.revokeObjectURL(previewUrls[index]);
    setAttachments(newAttachments);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPhoneError('');

    try {
      if (
        !formData.resourceId ||
        !formData.category ||
        !formData.description ||
        !formData.priority ||
        !formData.contactEmail
      ) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!validatePhoneNumber(formData.contactPhone)) {
        setPhoneError('Phone number must be 10 digits and start with 07 or 011.');
        setLoading(false);
        return;
      }

      const result = await createTicket(formData, attachments);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Create ticket error:', err);
      setError(err.response?.data?.message || 'Failed to create ticket');
      setLoading(false);
    }
  };

  const canGoNextFromStep1 = Boolean(formData.resourceId);
  const canGoNextFromStep2 = Boolean(formData.category && formData.priority && formData.description.trim());
  const isFinalStep = currentStep === 3;

  const handleNextStep = () => {
    if (currentStep === 1 && !canGoNextFromStep1) {
      setError('Please select a resource to continue');
      return;
    }
    if (currentStep === 2 && !canGoNextFromStep2) {
      setError('Please fill category, priority, and description to continue');
      return;
    }
    setError('');
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePreviousStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="rounded-3xl border border-ui-sky/12 bg-ui-base/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm overflow-hidden">
      <div className="border-b border-ui-sky/10 bg-[linear-gradient(135deg,rgba(111,143,114,0.08),rgba(232,226,216,0.85))] px-6 py-6 md:px-8">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ui-dim font-mono">
          Maintenance Request
        </div>
        <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.04em] text-ui-surface">
          Create Ticket
        </h2>
        <p className="mt-2 max-w-[680px] text-sm leading-6 text-ui-muted">
          Select the affected resource, describe the issue clearly, and attach photos if needed.
        </p>
        <div className="mt-4 grid gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] sm:grid-cols-3">
          {stepConfig.map((step) => (
            <StepPill
              key={step.id}
              number={step.id}
              label={step.label}
              active={currentStep === step.id}
              completed={currentStep > step.id}
            />
          ))}
        </div>
      </div>

      <div className="px-6 py-6 md:px-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-ui-danger/20 bg-ui-danger/8 px-4 py-3 text-sm text-ui-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {currentStep === 1 && (
            <section className="rounded-[22px] border border-ui-sky/10 bg-ui-base/70 p-4 md:p-5">
            <SectionHeader
              title="Resource"
              description="Choose the facility, room, or equipment connected to the issue."
            />

            <div className="mt-4">
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                className="mb-3 w-full rounded-2xl border border-ui-sky/15 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
                placeholder="Search resource by name, location, type, or ID"
                disabled={loadingResources || resources.length === 0}
              />
              <select
                name="resourceId"
                value={formData.resourceId}
                onChange={handleChange}
                className="w-full rounded-2xl border border-ui-sky/15 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
                required
                disabled={loadingResources || resources.length === 0}
              >
                <option value="">
                  {loadingResources ? 'Loading resources...' : 'Select a resource'}
                </option>
                {filteredResources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} - {resource.location}
                  </option>
                ))}
              </select>
              {!loadingResources && resources.length > 0 && (
                <p className="mt-2 text-xs text-ui-dim">
                  {filteredResources.length} matching resource{filteredResources.length !== 1 ? 's' : ''} found.
                </p>
              )}
            </div>

            {!loadingResources && filteredResources.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {filteredResources.slice(0, 6).map((resource) => {
                  const active = String(resource.id) === String(formData.resourceId);
                  return (
                    <button
                      key={resource.id}
                      type="button"
                      onClick={() => handleResourceSelect(resource.id)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        active
                          ? 'border-ui-sky/40 bg-ui-sky/10 shadow-[0_10px_24px_rgba(111,143,114,0.10)]'
                          : 'border-ui-sky/10 bg-ui-base hover:border-ui-sky/25 hover:bg-ui-sky/4'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-ui-bright">{resource.name}</div>
                          <div className="mt-1 text-xs text-ui-dim">{resource.location}</div>
                        </div>
                        <span className="rounded-full bg-ui-sky/10 px-2 py-1 text-[10px] font-mono text-ui-sky">
                          #{resource.id}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full border border-ui-sky/10 bg-ui-sky/5 px-2 py-1 text-ui-muted">
                          {resource.type?.replace(/_/g, ' ')}
                        </span>
                        <span className="rounded-full border border-ui-sky/10 bg-ui-sky/5 px-2 py-1 text-ui-muted">
                          Capacity: {resource.capacity ?? 'N/A'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!loadingResources && resources.length > 0 && filteredResources.length === 0 && (
              <div className="mt-4 rounded-2xl border border-ui-sky/12 bg-ui-sky/5 px-4 py-3 text-sm text-ui-muted">
                No resources match your search.
              </div>
            )}

            {selectedResource && (
              <div className="mt-4 grid gap-3 rounded-2xl border border-ui-sky/12 bg-ui-sky/5 p-4 md:grid-cols-3">
                <DetailItem label="Selected Resource" value={selectedResource.name} />
                <DetailItem label="Location" value={selectedResource.location || 'Not set'} />
                <DetailItem label="Type" value={selectedResource.type?.replace(/_/g, ' ') || 'Unknown'} />
              </div>
            )}
            </section>
          )}

          {currentStep === 2 && (
            <section className="rounded-[22px] border border-ui-sky/10 bg-ui-base/70 p-4 md:p-5">
              <div className="space-y-5">
              <SectionHeader
                title="Issue Details"
                description="Provide the maintenance team with the key information they need."
              />

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Category" required>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-ui-sky/15 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
                    required
                  >
                    <option value="">Select category</option>
                    {Object.values(TICKET_CATEGORY).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority" required>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-ui-sky/15 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
                    required
                  >
                    <option value="">Select priority</option>
                    {Object.values(TICKET_PRIORITY).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description" required>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  className="w-full rounded-2xl border border-ui-sky/15 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35 resize-y"
                  placeholder="Describe what happened, where it occurs, and any details that would help with diagnosis."
                  required
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-ui-dim">Tip: include location details and when the issue started.</span>
                  <span className={`${descriptionLength < 20 ? 'text-ui-warn' : 'text-ui-dim'}`}>
                    {descriptionLength} characters
                  </span>
                </div>
              </Field>
              </div>
            </section>
          )}

          {currentStep === 3 && (
            <section className="rounded-[22px] border border-ui-sky/10 bg-ui-base/70 p-4 md:p-5">
              <div className="space-y-5">
              <SectionHeader
                title="Contact & Attachments"
                description="Let the team reach you and review supporting evidence."
              />

              <Field label="Contact Email" required>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-ui-sky/15 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
                  placeholder="your.email@sliit.lk"
                  required
                />
              </Field>

              <Field label="Contact Phone">
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition ${
                    phoneError
                      ? 'border-ui-danger/45 focus:border-ui-danger'
                      : 'border-ui-sky/15 focus:border-ui-sky/35'
                  }`}
                  placeholder="0712345678 or 0112345678"
                  maxLength="10"
                />
                <p className="mt-2 text-xs text-ui-dim">
                  Must be 10 digits and start with <span className="font-semibold text-ui-bright">07</span> or <span className="font-semibold text-ui-bright">011</span>.
                </p>
                {phoneError && (
                  <p className="mt-2 text-xs font-medium text-ui-danger">
                    {phoneError}
                  </p>
                )}
              </Field>

              <div>
                <div className="mb-2 text-sm font-semibold text-ui-bright">Attachments</div>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-ui-sky/20 bg-ui-sky/4 px-4 py-4 transition hover:border-ui-sky/35 hover:bg-ui-sky/8">
                  <div>
                    <div className="text-sm font-semibold text-ui-bright">Upload images</div>
                    <div className="mt-1 text-xs text-ui-dim">Up to 3 files, 10MB each</div>
                  </div>
                  <div className="rounded-xl border border-ui-sky/14 bg-ui-base px-3 py-2 text-xs font-semibold text-ui-sky">
                    Browse
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-ui-dim">
                  JPG, PNG, and other image formats are supported.
                </p>

                {previewUrls.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="overflow-hidden rounded-2xl border border-ui-sky/12 bg-ui-base">
                        <div className="relative">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="absolute right-2 top-2 rounded-full bg-ui-danger px-2.5 py-1 text-xs font-bold text-ui-base"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="font-medium text-ui-bright">Image {index + 1}</span>
                          <span className="text-ui-dim">{Math.round(attachments[index].size / 1024)} KB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            </section>
          )}

          <div className="sticky bottom-0 z-10 -mx-6 border-t border-ui-sky/12 bg-ui-base/90 px-6 py-4 backdrop-blur-sm md:-mx-8 md:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ui-dim">
                Step {currentStep} of 3 {isFinalStep ? ' - Ready to submit your ticket.' : '- Complete this section to continue.'}
              </p>
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="rounded-xl border border-ui-sky/14 px-5 py-3 text-sm font-semibold text-ui-muted transition hover:bg-ui-sky/6 hover:text-ui-bright"
                  >
                    Back
                  </button>
                )}
                {!isFinalStep ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="rounded-xl bg-[linear-gradient(135deg,var(--color-ui-sky),var(--color-ui-green))] px-6 py-3 text-sm font-bold text-ui-base transition hover:opacity-95"
                  >
                    Continue
                  </button>
                ) : (
                  <>
                    {onCancel && (
                      <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-ui-sky/14 px-5 py-3 text-sm font-semibold text-ui-muted transition hover:bg-ui-sky/6 hover:text-ui-bright"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading || loadingResources}
                      className="rounded-xl bg-[linear-gradient(135deg,var(--color-ui-sky),var(--color-ui-green))] px-6 py-3 text-sm font-bold text-ui-base transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Creating...' : 'Create Ticket'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

function SectionHeader({ title, description }) {
  return (
    <div>
      <h3 className="text-[18px] font-bold tracking-[-0.02em] text-ui-surface">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-ui-muted">{description}</p>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-ui-bright">
        {label}
        {required && <span className="ml-1 text-ui-danger">*</span>}
      </div>
      {children}
    </label>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-ui-sky/10 bg-ui-base/70 px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ui-dim font-mono">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ui-bright">{value}</div>
    </div>
  );
}

function StepPill({ number, label, active = false, completed = false }) {
  const tone = completed
    ? 'border-ui-green/25 bg-ui-green/10 text-ui-green'
    : active
      ? 'border-ui-sky/25 bg-ui-sky/8 text-ui-sky'
      : 'border-ui-sky/12 bg-ui-base/60 text-ui-dim';

  return (
    <div className={`rounded-full border px-3 py-1.5 text-center ${tone}`}>
      {number}. {label}
    </div>
  );
}

export default TicketForm;
