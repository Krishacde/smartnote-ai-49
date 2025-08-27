import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Trash2, 
  Sparkles, 
  Clock, 
  FileText,
  Loader2
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

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onSummarize: (noteId: string, title: string, content: string) => void;
  isGeneratingSummary: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onSummarize,
  isGeneratingSummary
}) => {
  const [showFullContent, setShowFullContent] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleSummarize = () => {
    if (!note.content.trim()) {
      toast({
        title: "Cannot summarize",
        description: "Please add some content to the note first.",
        variant: "destructive"
      });
      return;
    }
    onSummarize(note.id, note.title, note.content);
  };

  const contentPreview = showFullContent 
    ? note.content 
    : truncateText(note.content, 200);

  return (
    <Card className="note-card note-card-hover group animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {note.title || 'Untitled Note'}
        </h3>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(note)}
            className="h-8 w-8 p-0 hover:bg-primary/10"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(note.id)}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {contentPreview}
          </div>
          {note.content.length > 200 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowFullContent(!showFullContent)}
              className="p-0 h-auto text-primary text-sm mt-2"
            >
              {showFullContent ? 'Show less' : 'Read more'}
            </Button>
          )}
        </div>

        {note.summary && (
          <div className="bg-accent-light/20 rounded-lg p-3 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">AI Summary</span>
            </div>
            <p className="text-sm text-muted-foreground">{note.summary}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(note.updated_at)}
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {note.content.split(/\s+/).length} words
            </div>
          </div>

          <Button
            onClick={handleSummarize}
            disabled={isGeneratingSummary}
            className="ai-button text-xs px-3 py-1 h-8"
          >
            {isGeneratingSummary ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                {note.summary ? 'Re-summarize' : 'AI Summary'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};