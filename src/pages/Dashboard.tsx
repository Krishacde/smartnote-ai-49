import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Brain, 
  LogOut, 
  User,
  FileText,
  Sparkles,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching notes",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setNotes(data || []);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    if (!user) return;

    setSavingNote(true);
    try {
      if (noteData.id) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update({
            title: noteData.title,
            content: noteData.content,
          })
          .eq('id', noteData.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        setNotes(prev => prev.map(note => 
          note.id === noteData.id ? { ...note, ...data } : note
        ));

        toast({
          title: "Note updated",
          description: "Your changes have been saved successfully."
        });
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert({
            title: noteData.title,
            content: noteData.content,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        setNotes(prev => [data, ...prev]);

        toast({
          title: "Note created",
          description: "Your new note has been saved successfully."
        });
      }

      setIsEditorOpen(false);
      setEditingNote(null);
    } catch (err) {
      console.error('Error saving note:', err);
      toast({
        title: "Error saving note",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));

      toast({
        title: "Note deleted",
        description: "The note has been removed successfully."
      });
    } catch (err) {
      console.error('Error deleting note:', err);
      toast({
        title: "Error deleting note",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const generateSummary = async (noteId: string, title: string, content: string) => {
    if (!content.trim()) {
      toast({
        title: "Cannot summarize",
        description: "Please add some content to the note first.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingSummary(noteId);
    
    try {
      const { data, error } = await supabase.functions.invoke('summarize-note', {
        body: { title, content }
      });

      if (error) throw error;

      if (!data?.summary) {
        throw new Error('No summary received');
      }

      // Update the note with the summary
      const { error: updateError } = await supabase
        .from('notes')
        .update({ summary: data.summary })
        .eq('id', noteId)
        .eq('user_id', user!.id);

      if (updateError) throw updateError;

      // Update local state
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, summary: data.summary } : note
      ));

      toast({
        title: "Summary generated!",
        description: "AI has successfully summarized your note.",
      });

    } catch (err: any) {
      console.error('Error generating summary:', err);
      toast({
        title: "Failed to generate summary",
        description: err.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setGeneratingSummary(null);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.summary && note.summary.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">SmartNotePro</h1>
              <p className="text-muted-foreground text-sm">
                Welcome back, {user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="sm:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 search-input"
            />
          </div>
          <Button
            onClick={handleCreateNote}
            className="bg-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{notes.length}</p>
                <p className="text-sm text-muted-foreground">Total Notes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-4 animate-scale-in" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {notes.filter(n => n.summary).length}
                </p>
                <p className="text-sm text-muted-foreground">AI Summaries</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <User className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {notes.reduce((acc, note) => acc + note.content.split(/\s+/).length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Words</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            {notes.length === 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">No notes yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create your first note to get started with AI-powered note-taking. 
                  Your ideas deserve smart organization!
                </p>
                <Button onClick={handleCreateNote} className="bg-primary hover:bg-primary-hover mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Note
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">No matching notes</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or create a new note.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note, index) => (
              <div 
                key={note.id} 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <NoteCard
                  note={note}
                  onEdit={handleEditNote}
                  onDelete={deleteNote}
                  onSummarize={generateSummary}
                  isGeneratingSummary={generatingSummary === note.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Editor Modal */}
        {isEditorOpen && (
          <NoteEditor
            note={editingNote}
            onSave={saveNote}
            onCancel={() => {
              setIsEditorOpen(false);
              setEditingNote(null);
            }}
            isLoading={savingNote}
          />
        )}
      </div>
    </div>
  );
};