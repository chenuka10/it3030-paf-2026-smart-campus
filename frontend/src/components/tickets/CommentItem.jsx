import React, { useState } from 'react';

const CommentItem = ({ comment, currentUserId, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.commentText);
  const [loading, setLoading] = useState(false);

  const isOwner = comment.userId === currentUserId;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSave = async () => {
    if (!editText.trim()) return;
    
    setLoading(true);
    try {
      await onUpdate(comment.id, editText);
      setIsEditing(false);
    } catch (error) {
      alert('Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    setLoading(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      alert('Failed to delete comment');
      setLoading(false);
    }
  };

  return (
    <div className="mb-3 rounded-2xl border border-ui-sky/10 bg-ui-base/72 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-ui-bright">
            {comment.userName || 'Unknown User'}
          </span>
          <span className="ml-2 text-xs text-ui-dim">
            {formatDate(comment.createdAt)}
          </span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="ml-1 text-xs text-ui-dim">(edited)</span>
          )}
        </div>
        
        {isOwner && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-ui-sky/14 px-2.5 py-1 text-xs font-semibold text-ui-sky transition hover:bg-ui-sky/6"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg border border-ui-danger/20 px-2.5 py-1 text-xs font-semibold text-ui-danger transition hover:bg-ui-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="mb-2 w-full rounded-xl border border-ui-sky/14 bg-ui-base px-3 py-2 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
            rows="3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading || !editText.trim()}
              className="rounded-lg bg-[linear-gradient(135deg,var(--color-ui-sky),var(--color-ui-green))] px-3 py-1.5 text-xs font-bold text-ui-base transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditText(comment.commentText);
              }}
              disabled={loading}
              className="rounded-lg border border-ui-sky/14 px-3 py-1.5 text-xs font-semibold text-ui-muted transition hover:bg-ui-sky/6 hover:text-ui-bright disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-6 text-ui-muted">{comment.commentText}</p>
      )}
    </div>
  );
};

export default CommentItem;
