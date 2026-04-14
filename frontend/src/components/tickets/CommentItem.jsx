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
    <div className="bg-gray-50 rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-medium text-gray-800">
            {comment.userName || `User #${comment.userId}`}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            {formatDate(comment.createdAt)}
          </span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="text-xs text-gray-400 ml-1">(edited)</span>
          )}
        </div>
        
        {isOwner && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 hover:text-red-800 text-sm"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            rows="3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading || !editText.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditText(comment.commentText);
              }}
              disabled={loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 whitespace-pre-wrap">{comment.commentText}</p>
      )}
    </div>
  );
};

export default CommentItem;