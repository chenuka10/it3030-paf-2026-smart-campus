import React, { useState, useEffect } from 'react';
import { getTicketComments, addComment, updateComment, deleteComment } from '../../api/ticketApi';
import CommentItem from './CommentItem';

const CommentSection = ({ ticketId, currentUserId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [ticketId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await getTicketComments(ticketId);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const comment = await addComment(ticketId, newComment);
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId, newText) => {
    await updateComment(ticketId, commentId, newText);
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, commentText: newText, updatedAt: new Date().toISOString() } : c
    ));
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment(ticketId, commentId);
    setComments(comments.filter(c => c.id !== commentId));
  };

  return (
    <section className="mt-6 rounded-[24px] border border-ui-sky/12 bg-ui-base/82 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] md:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[20px] font-bold tracking-[-0.02em] text-ui-surface">Comments ({comments.length})</h3>
          <p className="mt-1 text-sm text-ui-muted">Collaborate with updates and technical context.</p>
        </div>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write an update, question, or resolution note..."
          className="mb-3 w-full rounded-2xl border border-ui-sky/14 bg-ui-base px-4 py-3 text-sm text-ui-bright outline-none transition focus:border-ui-sky/35"
          rows="3"
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="rounded-xl bg-[linear-gradient(135deg,var(--color-ui-sky),var(--color-ui-green))] px-5 py-2.5 text-sm font-bold text-ui-base transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="rounded-2xl border border-ui-sky/10 bg-ui-panel/20 py-8 text-center">
          <p className="text-sm text-ui-muted">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ui-sky/14 bg-ui-sky/4 py-9 text-center">
          <p className="text-sm text-ui-muted">No comments yet. Be the first to add one.</p>
        </div>
      ) : (
        <div>
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentSection;