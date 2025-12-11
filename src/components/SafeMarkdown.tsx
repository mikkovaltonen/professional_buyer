import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';

interface SafeMarkdownProps {
  children: string;
  className?: string;
  onSupplierSelect?: (supplier: Record<string, unknown>) => void;
}

// Interactive JSON Table Component
interface JsonTableProps {
  data: Record<string, unknown>[];
  onRowSelect?: (row: Record<string, unknown>) => void;
}

const JsonTable: React.FC<JsonTableProps> = ({ data, onRowSelect }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = String(a[sortColumn] ?? '');
    const bVal = String(b[sortColumn] ?? '');

    // Try numeric sort for price-like values
    const aNum = parseFloat(aVal.replace(/[€$,\s]/g, ''));
    const bNum = parseFloat(bVal.replace(/[€$,\s]/g, ''));

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }

    return sortDirection === 'asc'
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });

  const handleRowClick = (row: Record<string, unknown>, index: number) => {
    setSelectedRow(index);
    onRowSelect?.(row);
  };

  const isRecommended = (row: Record<string, unknown>): boolean => {
    const rec = String(row['Recommendation'] || row['recommendation'] || '').toLowerCase();
    return rec.includes('best') || rec.includes('recommended') || rec.includes('suositus');
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                className="px-4 py-3 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div className="flex items-center gap-1">
                  {col}
                  {sortColumn === col && (
                    sortDirection === 'asc'
                      ? <ChevronUp className="h-4 w-4 text-primary" />
                      : <ChevronDown className="h-4 w-4 text-primary" />
                  )}
                </div>
              </th>
            ))}
            {onRowSelect && <th className="px-4 py-3 w-20"></th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => {
            const recommended = isRecommended(row);
            const isSelected = selectedRow === idx;

            return (
              <tr
                key={idx}
                onClick={() => handleRowClick(row, idx)}
                className={`
                  border-b border-slate-100 transition-all duration-150 cursor-pointer
                  ${recommended
                    ? 'bg-emerald-50 hover:bg-emerald-200 hover:shadow-md hover:scale-[1.01]'
                    : 'hover:bg-blue-50 hover:shadow-md hover:scale-[1.01]'}
                  ${isSelected ? 'ring-2 ring-inset ring-primary bg-primary/10 shadow-md' : ''}
                `}
              >
                {columns.map((col) => {
                  const value = String(row[col] ?? '');
                  const isRecColumn = col.toLowerCase() === 'recommendation';

                  return (
                    <td
                      key={col}
                      className={`px-4 py-3 ${isRecColumn && recommended ? 'font-semibold text-emerald-700' : 'text-slate-600'}`}
                    >
                      {isRecColumn && recommended && (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          {value}
                        </span>
                      )}
                      {!(isRecColumn && recommended) && value}
                    </td>
                  );
                })}
                {onRowSelect && (
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(row, idx);
                      }}
                      className={`
                        px-3 py-1 text-xs font-medium rounded-full transition-colors
                        ${isSelected
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-primary hover:text-white'}
                      `}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Parse JSON blocks from markdown text
const parseJsonBlocks = (text: string): { type: 'text' | 'json'; content: string | Record<string, unknown>[] }[] => {
  const parts: { type: 'text' | 'json'; content: string | Record<string, unknown>[] }[] = [];
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = jsonBlockRegex.exec(text)) !== null) {
    // Add text before the JSON block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    // Try to parse the JSON
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);

      // Only treat as interactive table if it's an array of objects
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        parts.push({ type: 'json', content: parsed });
      } else {
        // Keep as text if not a table-like structure
        parts.push({ type: 'text', content: match[0] });
      }
    } catch {
      // If JSON parsing fails, keep as text
      parts.push({ type: 'text', content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
};

/**
 * SafeMarkdown - XSS-protected Markdown renderer
 *
 * Security features:
 * - Validates all URLs before rendering
 * - Blocks dangerous protocols (javascript:, vbscript:, data:text/html)
 * - Adds rel="noopener noreferrer" to external links (prevents tabnabbing)
 * - Sanitizes image sources
 * - Uses react-markdown's built-in HTML sanitization
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ children, className, onSupplierSelect }) => {
  // URL validation helper
  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;

    const urlLower = url.toLowerCase().trim();

    // Allowed protocols
    const allowedProtocols = ['http://', 'https://', 'mailto:'];

    // Blocked dangerous protocols
    const blockedProtocols = ['javascript:', 'vbscript:', 'data:text/html', 'file:'];

    // Check for blocked protocols
    if (blockedProtocols.some(protocol => urlLower.startsWith(protocol))) {
      console.warn(`[SafeMarkdown] Blocked dangerous URL: ${url}`);
      return false;
    }

    // Check for allowed protocols or relative URLs
    const isAllowed = allowedProtocols.some(protocol => urlLower.startsWith(protocol)) ||
                      urlLower.startsWith('/') ||
                      urlLower.startsWith('#');

    return isAllowed;
  };

  // Image URL validation (more permissive, allows data: URIs for inline images)
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;

    const urlLower = url.toLowerCase().trim();

    // Allowed protocols for images
    const allowedProtocols = ['http://', 'https://', 'data:image/', '/'];

    // Blocked dangerous protocols
    const blockedProtocols = ['javascript:', 'vbscript:', 'data:text/html'];

    // Check for blocked protocols
    if (blockedProtocols.some(protocol => urlLower.startsWith(protocol))) {
      console.warn(`[SafeMarkdown] Blocked dangerous image URL: ${url}`);
      return false;
    }

    // Check for allowed protocols
    const isAllowed = allowedProtocols.some(protocol => urlLower.startsWith(protocol));

    return isAllowed;
  };

  // Custom components with security enhancements
  const components: Components = {
    // Safe link component
    a: ({ href, children, ...props }) => {
      if (!isValidUrl(href)) {
        // If URL is invalid, render as plain text instead of a link
        return <span className="text-gray-500">{children}</span>;
      }

      // Add security attributes for external links
      const isExternal = href?.startsWith('http://') || href?.startsWith('https://');

      return (
        <a
          href={href}
          {...props}
          {...(isExternal && {
            target: '_blank',
            rel: 'noopener noreferrer' // Prevents tabnabbing attacks
          })}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {children}
        </a>
      );
    },

    // Safe image component
    img: ({ src, alt, ...props }) => {
      if (!isValidImageUrl(src)) {
        // If image URL is invalid, show alt text or placeholder
        return (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
            [Image: {alt || 'Invalid source'}]
          </span>
        );
      }

      return (
        <img
          src={src}
          alt={alt || ''}
          {...props}
          className="max-w-full h-auto rounded"
          loading="lazy"
        />
      );
    }
  };

  // Parse content for JSON blocks
  const parts = parseJsonBlocks(children);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.type === 'json') {
          return (
            <JsonTable
              key={index}
              data={part.content as Record<string, unknown>[]}
              onRowSelect={onSupplierSelect}
            />
          );
        }

        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {part.content as string}
          </ReactMarkdown>
        );
      })}
    </div>
  );
};
