# Security Audit - Procurement AI Agent Evaluator

## Overview
This document outlines the security measures implemented in the application, particularly focusing on XSS (Cross-Site Scripting) prevention and secure Markdown rendering.

## XSS Protection Measures

### Markdown Rendering Security

#### Implementation: SafeMarkdown Component
**Location:** `src/components/SafeMarkdown.tsx`

The application uses a custom `SafeMarkdown` component that provides defense-in-depth protection against XSS attacks in Markdown content.

#### Security Features

1. **URL Protocol Validation**
   - **Allowed protocols for links:** `http://`, `https://`, `mailto:`, relative URLs (`/`, `#`)
   - **Blocked dangerous protocols:** `javascript:`, `vbscript:`, `data:text/html`, `file:`
   - Invalid URLs are rendered as plain text instead of clickable links

2. **Image Source Validation**
   - **Allowed protocols:** `http://`, `https://`, `data:image/`, relative URLs (`/`)
   - **Blocked protocols:** `javascript:`, `vbscript:`, `data:text/html`
   - Invalid image sources display a placeholder with alt text

3. **Tabnabbing Prevention**
   - All external links automatically include `rel="noopener noreferrer"`
   - Prevents malicious sites from accessing the `window.opener` object
   - Opens external links in new tabs (`target="_blank"`)

4. **HTML Sanitization**
   - Built-in sanitization from `react-markdown` library
   - HTML tags are not rendered by default
   - Only Markdown syntax is processed

#### Protected Components

The `SafeMarkdown` component is used in the following locations:

1. **ProcurementChat.tsx** (Line 422)
   - Renders AI responses in document analysis chat
   - Processes citation sources with Markdown formatting

2. **ProfessionalBuyerChat.tsx** (Lines 980, 1156)
   - Renders AI responses in professional buyer chat interface
   - Handles both user and model messages with proper styling

### Attack Vectors Mitigated

#### 1. JavaScript Protocol Injection
**Example Attack:**
```markdown
[Click me](javascript:alert('XSS'))
```
**Protection:** URL is validated and rendered as plain text instead of a link.

#### 2. Data URI XSS
**Example Attack:**
```markdown
[Malicious](data:text/html,<script>alert('XSS')</script>)
```
**Protection:** `data:text/html` protocol is blocked in link validation.

#### 3. VBScript Injection
**Example Attack:**
```markdown
[Attack](vbscript:msgbox('XSS'))
```
**Protection:** `vbscript:` protocol is explicitly blocked.

#### 4. Malicious Image Sources
**Example Attack:**
```markdown
![XSS](javascript:alert('XSS'))
```
**Protection:** JavaScript protocol in images is blocked and replaced with a placeholder.

#### 5. Tabnabbing
**Example Attack:**
External links without `rel="noopener"` can access the parent window.
**Protection:** All external links automatically include `rel="noopener noreferrer"`.

## Dependencies Security

### React-Markdown
- **Version:** 10.1.0
- **Security:** Sanitizes HTML by default
- **Usage:** Base library for Markdown rendering

### Remark-GFM
- **Version:** 4.0.1
- **Purpose:** GitHub Flavored Markdown support
- **Security:** Adds table, strikethrough, and other GFM features without security concerns

## Recommendations for Developers

### 1. Maintaining Security
- **NEVER** use `dangerouslySetInnerHTML` for user-generated content
- **ALWAYS** use the `SafeMarkdown` component for rendering Markdown
- **NEVER** bypass URL validation in the SafeMarkdown component
- Keep `react-markdown` and `remark-gfm` dependencies up to date

### 2. Testing Security
When testing AI responses or user input, try these payloads to verify XSS protection:

```markdown
# XSS Test Cases

## JavaScript Protocol
[Click me](javascript:alert('XSS'))

## Data URI HTML
[Malicious](data:text/html,<script>alert('XSS')</script>)

## VBScript
[Attack](vbscript:msgbox('XSS'))

## Image XSS
![XSS](javascript:alert('XSS'))

## Event Handlers
<img src="x" onerror="alert('XSS')">

## HTML Tags
<script>alert('XSS')</script>
```

**Expected Behavior:** All these attempts should be sanitized or blocked by the SafeMarkdown component.

### 3. Adding New Markdown Renderers
If you need to add Markdown rendering in a new component:

```tsx
import { SafeMarkdown } from './SafeMarkdown';

// Correct usage
<SafeMarkdown className="prose">
  {userContent}
</SafeMarkdown>

// WRONG - Don't do this!
<ReactMarkdown>{userContent}</ReactMarkdown>
```

## Additional Security Considerations

### 1. API Key Protection
- API keys are stored in environment variables
- Never commit `.env` files to version control
- Use `.env.example` for documentation

### 2. Authentication
- Firebase authentication with email/password
- Session management via sessionService
- User-specific data isolation in Firestore

### 3. File Upload Security
- File type validation before processing
- Size limits enforced
- Content validation for supported formats (PDF, Excel, CSV, Word)

### 4. Content Security Policy (Future Enhancement)
Consider implementing CSP headers to further restrict:
- Inline script execution
- External resource loading
- Frame embedding

## Security Incident Response

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Contact the development team directly
3. Provide details about the vulnerability
4. Wait for a security patch before disclosure

## Audit History

| Date | Version | Changes | Auditor |
|------|---------|---------|---------|
| 2025-11-10 | 1.0 | Initial security audit - Implemented SafeMarkdown component with XSS protection | Claude Code |

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React-Markdown Security](https://github.com/remarkjs/react-markdown#security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
