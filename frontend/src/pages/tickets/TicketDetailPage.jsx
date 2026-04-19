import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById, deleteTicket, getAttachmentUrl } from '../../api/ticketApi';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/ticketConstants';
import CommentSection from '../../components/tickets/CommentSection';
import StatusUpdateModal from '../../components/tickets/StatusUpdateModal';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

const formatTicketCode = (ticketId) => `ID-${String(ticketId).padStart(3, '0')}`;

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentUserId = user?.id;
  const userRole = user?.role || 'USER';

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getTicketById(id);
      setTicket(data);
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
      setError(err.response?.data?.message || 'Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteTicket(id);
      navigate('/tickets');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete ticket');
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canUpdateStatus = userRole === 'ADMIN' || userRole === 'TECHNICIAN';
  const canDelete = userRole === 'ADMIN';

  if (loading) {
    return (
      <Layout>
        <PageState
          title="Loading ticket"
          description="Fetching the latest maintenance details."
        />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-[24px] border border-ui-danger/18 bg-ui-danger/8 px-5 py-5 text-ui-danger">
            <div className="text-lg font-bold">Unable to load ticket</div>
            <p className="mt-2 text-sm">{error}</p>
            <button
              onClick={() => navigate('/tickets')}
              className="mt-4 rounded-xl border border-ui-danger/20 px-4 py-2 text-sm font-semibold transition hover:bg-ui-danger/10"
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <PageState
          title="Ticket not found"
          description="The requested ticket is unavailable or may have been removed."
          actionLabel="Back to Tickets"
          onAction={() => navigate('/tickets')}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <button
          onClick={() => navigate('/tickets')}
          className="mb-5 rounded-xl border border-ui-sky/12 bg-ui-base/70 px-4 py-2 text-sm font-semibold text-ui-muted transition hover:bg-ui-sky/6 hover:text-ui-bright"
        >
          Back to Tickets
        </button>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-ui-sky/12 bg-[linear-gradient(135deg,rgba(232,226,216,0.92),rgba(245,242,236,0.98))] px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ui-dim font-mono">
                  Ticket Overview
                </div>
                <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.04em] text-ui-surface">
                  Ticket {formatTicketCode(ticket.id)}
                </h1>
                <p className="mt-2 text-sm leading-6 text-ui-muted">
                  Resource ID: <span className="font-semibold text-ui-bright">{ticket.resourceId}</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                  <span className="rounded-full border border-ui-sky/10 bg-ui-sky/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ui-muted">
                    {ticket.category.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                <OverviewCard label="Created" value={formatDate(ticket.createdAt)} />
                <OverviewCard label="Last Updated" value={formatDate(ticket.updatedAt)} />
                <OverviewCard
                  label="Assigned Technician"
                  value={ticket.assignedTechnicianName || 'Unassigned'}
                />
                <OverviewCard label="Comments" value={`${ticket.commentCount || 0}`} />
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <DetailSection
                title="Issue Description"
                description="Detailed report submitted for this maintenance request."
              >
                <p className="whitespace-pre-wrap text-sm leading-7 text-ui-muted">
                  {ticket.description}
                </p>
              </DetailSection>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <DetailSection
                  title="Attachments"
                  description={`${ticket.attachments.length} uploaded file${ticket.attachments.length > 1 ? 's' : ''} attached to this ticket.`}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {ticket.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={getAttachmentUrl(attachment.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="overflow-hidden rounded-[22px] border border-ui-sky/12 bg-ui-base transition hover:border-ui-sky/25 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
                      >
                        <img
                          src={getAttachmentUrl(attachment.fileUrl)}
                          alt={attachment.fileName}
                          className="h-44 w-full object-cover"
                        />
                        <div className="px-4 py-3">
                          <div className="truncate text-sm font-semibold text-ui-bright">{attachment.fileName}</div>
                          <div className="mt-1 text-xs text-ui-dim">Open attachment</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </DetailSection>
              )}

              {ticket.resolutionNotes && (
                <DetailSection
                  title="Resolution Notes"
                  description="Technician or admin notes recorded when the issue was resolved."
                  tone="success"
                >
                  <p className="whitespace-pre-wrap text-sm leading-7 text-ui-muted">
                    {ticket.resolutionNotes}
                  </p>
                </DetailSection>
              )}

              {ticket.rejectionReason && (
                <DetailSection
                  title="Rejection Reason"
                  description="Reason provided when the ticket was rejected."
                  tone="danger"
                >
                  <p className="whitespace-pre-wrap text-sm leading-7 text-ui-muted">
                    {ticket.rejectionReason}
                  </p>
                </DetailSection>
              )}
            </div>

            <div className="space-y-6">
              <DetailSection
                title="Contact Information"
                description="Details provided by the requester."
              >
                <div className="space-y-4">
                  <ContactRow label="Email" value={ticket.contactEmail} />
                  <ContactRow label="Phone" value={ticket.contactPhone || 'Not provided'} />
                </div>
              </DetailSection>

              <DetailSection
                title="Actions"
                description="Available actions depend on your current role."
              >
                <div className="flex flex-col gap-3">
                  {canUpdateStatus && (
                    <button
                      onClick={() => setShowStatusModal(true)}
                      className="rounded-xl bg-ui-sky px-5 py-3 text-sm font-bold text-ui-base transition hover:opacity-95"
                    >
                      Update Status
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-xl border border-ui-danger/25 bg-ui-danger/8 px-5 py-3 text-sm font-bold text-ui-danger transition hover:bg-ui-danger/12 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deleting ? 'Deleting...' : 'Delete Ticket'}
                    </button>
                  )}
                </div>
              </DetailSection>
            </div>
          </div>

          <CommentSection
            ticketId={ticket.id}
            currentUserId={currentUserId}
          />
        </div>

        {showStatusModal && (
          <StatusUpdateModal
            ticket={ticket}
            onClose={() => setShowStatusModal(false)}
            onSuccess={() => {
              setShowStatusModal(false);
              fetchTicket();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

function PageState({ title, description, actionLabel, onAction }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="rounded-[24px] border border-ui-sky/12 bg-ui-base/80 px-6 py-14 text-center shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <div className="text-[28px] font-bold text-ui-surface">{title}</div>
        <p className="mt-3 text-sm text-ui-muted">{description}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-5 rounded-xl border border-ui-sky/14 px-4 py-2 text-sm font-semibold text-ui-muted transition hover:bg-ui-sky/6 hover:text-ui-bright"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-ui-sky/10 bg-ui-base/70 px-4 py-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ui-dim font-mono">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-ui-bright">{value}</div>
    </div>
  );
}

function DetailSection({ title, description, children, tone = 'default' }) {
  const tones = {
    default: 'border-ui-sky/12 bg-ui-base/82',
    success: 'border-ui-green/18 bg-ui-green/6',
    danger: 'border-ui-danger/16 bg-ui-danger/6'
  };

  return (
    <section className={`rounded-[24px] border p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] ${tones[tone] || tones.default}`}>
      <div className="mb-4">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">{title}</h2>
        <p className="mt-1 text-sm text-ui-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ContactRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-ui-sky/10 bg-ui-base/70 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ui-dim font-mono">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ui-bright">{value}</div>
    </div>
  );
}

export default TicketDetailPage;
