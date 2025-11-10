import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface SafeMarkdownProps {
  children: string;
  className?: string;
}

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
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ children, className }) => {
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

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
