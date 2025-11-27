import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api.js';
import './NotionAI.module.css';

/**
 * NotionAI Component
 * Provides AI-powered content generation for books using Notion AI
 */
export default function NotionAI({ book, onContentGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [notionStatus, setNotionStatus] = useState(null);

  // Check Notion status on mount
  useEffect(() => {
    let isMounted = true;

    const checkNotionStatus = async () => {
      try {
        const data = await apiClient.notion.status();
        if (isMounted) {
          setNotionStatus(data);
        }
      } catch (err) {
        console.error('Failed to check Notion status:', err);
      }
    };

    checkNotionStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const generateDescription = async () => {
    if (!book?.title) {
      setError('Book title is required');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const data = await apiClient.notion.generateDescription({
        title: book.title,
        authors: book.authors || [],
        genre: book.genre || null,
        tags: book.tags || []
      });
      setGeneratedContent({
        type: 'description',
        content: data.description
      });

      if (onContentGenerated) {
        onContentGenerated('description', data.description);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate description');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!book?.title) {
      setError('Book title is required');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const data = await apiClient.notion.generateSummary({
        title: book.title,
        description: book.description || null,
        authors: book.authors || []
      });
      setGeneratedContent({
        type: 'summary',
        content: data.summary
      });

      if (onContentGenerated) {
        onContentGenerated('summary', data.summary);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const generateMarketingCopy = async () => {
    if (!book?.title) {
      setError('Book title is required');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const data = await apiClient.notion.generateMarketing({
        title: book.title,
        authors: book.authors || [],
        genre: book.genre || null
      });
      setGeneratedContent({
        type: 'marketing',
        content: data.marketingCopy
      });

      if (onContentGenerated) {
        onContentGenerated('marketing', data.marketingCopy);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate marketing copy');
    } finally {
      setLoading(false);
    }
  };

  const syncToNotion = async () => {
    if (!book?.id) {
      setError('Book ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.notion.syncBook({
        bookId: book.id
      });
      setGeneratedContent({
        type: 'sync',
        content: `Book synced successfully! View in Notion: ${data.notionUrl}`,
        notionUrl: data.notionUrl
      });
    } catch (err) {
      setError(err.message || 'Failed to sync to Notion');
    } finally {
      setLoading(false);
    }
  };

  if (!notionStatus?.available && notionStatus !== null) {
    return (
      <div className="notion-ai-container">
        <div className="notion-ai-warning">
          <h3>Notion AI Not Configured</h3>
          <p>
            To use Notion AI features, please configure your Notion API key and database ID.
            See the documentation for setup instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="notion-ai-container">
      <div className="notion-ai-header">
        <h3>Notion AI Assistant</h3>
        <p>Generate AI-powered content for your book</p>
      </div>

      {error && (
        <div className="notion-ai-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="notion-ai-actions">
        <button
          onClick={generateDescription}
          disabled={loading || !book?.title}
          className="notion-ai-button"
        >
          {loading ? 'Generating...' : 'Generate Description'}
        </button>

        <button
          onClick={generateSummary}
          disabled={loading || !book?.title}
          className="notion-ai-button"
        >
          {loading ? 'Generating...' : 'Generate Summary'}
        </button>

        <button
          onClick={generateMarketingCopy}
          disabled={loading || !book?.title}
          className="notion-ai-button"
        >
          {loading ? 'Generating...' : 'Generate Marketing Copy'}
        </button>

        <button
          onClick={syncToNotion}
          disabled={loading || !book?.id}
          className="notion-ai-button notion-ai-button-sync"
        >
          {loading ? 'Syncing...' : 'Sync to Notion'}
        </button>
      </div>

      {generatedContent && (
        <div className="notion-ai-result">
          <h4>
            Generated {generatedContent.type === 'description' && 'Description'}
            {generatedContent.type === 'summary' && 'Summary'}
            {generatedContent.type === 'marketing' && 'Marketing Copy'}
            {generatedContent.type === 'sync' && 'Sync Result'}
          </h4>
          <div className="notion-ai-content">
            {generatedContent.content}
          </div>
          {generatedContent.notionUrl && (
            <a
              href={generatedContent.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="notion-ai-link"
            >
              Open in Notion →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

