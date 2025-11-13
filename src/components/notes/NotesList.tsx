'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus } from 'lucide-react';

interface Note {
  type: string;
  timestamp: string;
  user: string;
  content: string;
}

interface NotesListProps {
  leadId: string;
}

export function NotesList({ leadId }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'General',
  });
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/leads/${leadId}/notes`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Notes API error: ${response.status} - ${errorText}`);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setNotes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notes';
      setError(errorMessage);
      console.error('Error fetching notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  // Fetch notes for the lead
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async () => {
    if (!newNote.content.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote.content,
          type: newNote.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create note');
      }

      // Success - refresh notes list
      await fetchNotes();
      setNewNote({ content: '', type: 'General' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      console.error('Error creating note:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Call: 'bg-blue-100 text-blue-800 border-blue-200',
      Email: 'bg-green-100 text-green-800 border-green-200',
      Text: 'bg-purple-100 text-purple-800 border-purple-200',
      Meeting: 'bg-orange-100 text-orange-800 border-orange-200',
      General: 'bg-gray-100 text-gray-800 border-gray-200',
      Issue: 'bg-red-100 text-red-800 border-red-200',
      Success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return colors[type] || colors.General;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Lead Notes ({notes.length})</h3>
        </div>

        {/* Create new note form */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            <select
              value={newNote.type}
              onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-32"
            >
              <option value="General">General</option>
              <option value="Call">Call</option>
              <option value="Email">Email</option>
              <option value="Text">Text</option>
              <option value="Meeting">Meeting</option>
              <option value="Issue">Issue</option>
              <option value="Success">Success</option>
            </select>
            <button
              onClick={createNote}
              disabled={!newNote.content.trim() || isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Adding...' : 'Add Note'}
            </button>
          </div>
          <textarea
            placeholder="Enter your note here..."
            value={newNote.content}
            onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] resize-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Notes list */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notes yet. Add your first note above.</p>
            </div>
          ) : (
            notes.map((note, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(note.type)}`}>
                      {note.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(note.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-sm text-gray-600">by {note.user}</span>
                  </div>
                </div>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

