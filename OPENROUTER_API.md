# OpenRouter API Integration Documentation

## Overview

The Valmet Procurement AI Assistant has migrated from Google Gemini to OpenRouter API, leveraging the free tier Grok-4-fast model. This document details the implementation, configuration, and usage of OpenRouter in the codebase.

## Configuration

### Environment Variables

```env
# OpenRouter API Configuration
VITE_OPEN_ROUTER_API_KEY=your-openrouter-api-key
```

### Model Selection

The application uses the **Grok-4-fast** model via OpenRouter's free tier:

```typescript
const geminiModel = 'x-ai/grok-4-fast:free';
```

## Implementation Details

### Core Component

The OpenRouter integration is implemented in `/src/components/ProfessionalBuyerChat.tsx`.

### API Key Setup

```typescript
const openRouterApiKey = import.meta.env.VITE_OPEN_ROUTER_API_KEY || '';
```

### API Call Function

The main API interaction happens through the `callOpenRouterAPI` helper function:

```typescript
const callOpenRouterAPI = async (messages: any[], systemPrompt: string, tools?: any[]) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin || 'https://valmet-buyer.firebaseapp.com',
      'X-Title': 'Valmet Procurement Assistant'
    },
    body: JSON.stringify({
      model: geminiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: typeof msg.parts[0] === 'object' ? msg.parts[0].text : msg.parts[0]
        }))
      ],
      temperature: 0,
      ...(tools && tools.length > 0 ? { tools, tool_choice: 'auto' } : {})
    })
  });

  // Error handling and response parsing
  if (!response.ok) {
    let errorMessage = '';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData);
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(`OpenRouter API error ${response.status}: ${errorMessage}`);
  }

  return await response.json();
};
```

## Key Features

### 1. Message Format Conversion

OpenRouter uses the standard OpenAI format, requiring conversion from the legacy Gemini format:

```typescript
messages.map((msg: any) => ({
  role: msg.role === 'model' ? 'assistant' : msg.role,
  content: typeof msg.parts[0] === 'object' ? msg.parts[0].text : msg.parts[0]
}))
```

### 2. Function Calling (Tools)

The system supports two main functions through OpenRouter's tool calling:

#### Supplier Search Function
```typescript
const searchSuppliersFunction = {
  name: "search_suppliers",
  description: "Search for verified suppliers in Valmet's supplier database",
  parameters: {
    type: "object",
    properties: {
      mainCategory: { type: "string", enum: MAIN_CATEGORY_LOV.map(c => c.value) },
      supplierCategories: { type: "string" },
      country: { type: "string" },
      city: { type: "string" },
      vendorName: { type: "string" },
      limit: { type: "number" }
    }
  }
};
```

#### Purchase Requisition Function
```typescript
const createRequisitionFunction = {
  name: "create_purchase_requisition",
  description: "Create a purchase requisition in Basware via POST API",
  parameters: {
    type: "object",
    properties: {
      header: { /* requisition header details */ },
      lines: { /* array of line items */ },
      attachments: { /* optional attachments */ },
      customFields: { /* customer-specific fields */ }
    },
    required: ["header", "lines"]
  }
};
```

### 3. Tool Call Processing

When OpenRouter returns tool calls, the system processes them accordingly:

```typescript
if (content?.tool_calls && content.tool_calls.length > 0) {
  for (const toolCall of content.tool_calls) {
    const functionName = toolCall.function.name;
    const functionArgs = typeof toolCall.function.arguments === 'string'
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    if (functionName === 'search_suppliers') {
      // Execute supplier search
      const searchResult = await searchSuppliersForChat(functionArgs);
      // Process and return results
    }

    if (functionName === 'create_purchase_requisition') {
      // Create purchase requisition
      const requisitionId = await purchaseRequisitionService.createRequisition(/*...*/);
      // Return confirmation
    }
  }
}
```

## Error Handling

The system includes comprehensive error handling for various OpenRouter API responses:

```typescript
// Specific error code handling
if (error.message.includes('overloaded') || error.message.includes('503')) {
  errorMessage = "The AI service is temporarily overloaded. Please wait a moment and try again.";
} else if (error.message.includes('402')) {
  errorMessage = "OpenRouter API credits exhausted. Please check your account balance.";
} else if (error.message.includes('401')) {
  errorMessage = "OpenRouter authentication failed. Please check your API key.";
} else if (error.message.includes('429')) {
  errorMessage = "Too many requests. Please wait a moment before trying again.";
}
```

## Logging and Debugging

The implementation includes extensive logging for debugging and monitoring:

```typescript
// API configuration logging
console.log('OpenRouter API config v1.6:', {
  version: '1.6-requisition-fix',
  apiKey: openRouterApiKey ? `${openRouterApiKey.substring(0, 10)}...` : 'undefined',
  model: geminiModel,
  timestamp: new Date().toISOString(),
  toolSupport: true
});

// Tool call logging
console.log('🤖 AI SUPPLIER SEARCH CALL [' + aiRequestId + ']:', {
  triggered_by_user_message: textToSend,
  function_name: functionName,
  ai_generated_parameters: functionArgs,
  timestamp: new Date().toISOString(),
  ai_request_id: aiRequestId
});
```

## API Request Headers

Required headers for OpenRouter API calls:

- **Authorization**: Bearer token with your OpenRouter API key
- **Content-Type**: `application/json`
- **HTTP-Referer**: Your application's origin URL (required by OpenRouter)
- **X-Title**: Application title for OpenRouter dashboard

## Temperature Setting

The system uses `temperature: 0` for deterministic, consistent responses suitable for business procurement operations.

## Migration from Gemini

### Key Changes

1. **API Endpoint**: Changed from Google Generative AI to `https://openrouter.ai/api/v1/chat/completions`
2. **Authentication**: From Gemini API key to OpenRouter API key
3. **Message Format**: Converted from Gemini's parts-based format to OpenAI's content format
4. **Model**: From `gemini-2.5-flash-preview-04-17` to `x-ai/grok-4-fast:free`
5. **Tool Calling**: Adapted from Gemini's function calling to OpenRouter's OpenAI-compatible format

### Benefits of Migration

- **Cost**: Free tier available with Grok-4-fast model
- **Availability**: Better uptime and availability
- **Standards**: OpenAI-compatible format for easier future migrations
- **Performance**: Comparable response times and quality

## Usage Example

Here's how the chat component processes a user message with OpenRouter:

```typescript
// 1. Prepare the message history
const messagesWithCurrent = [...messages, { role: 'user', parts: [{ text: textToSend }] }];

// 2. Prepare tools for OpenRouter
const openRouterTools = [
  {
    type: 'function',
    function: {
      name: 'search_suppliers',
      description: searchSuppliersFunction.description,
      parameters: searchSuppliersFunction.parameters
    }
  },
  // ... other tools
];

// 3. Call OpenRouter API
const result = await callOpenRouterAPI(messagesWithCurrent, systemPrompt, openRouterTools);

// 4. Process the response
if (result?.choices?.[0]?.message?.tool_calls) {
  // Handle tool calls
} else {
  // Handle regular text response
}
```

## Testing

To test the OpenRouter integration:

1. Set up your environment variable:
   ```bash
   VITE_OPEN_ROUTER_API_KEY=your-api-key
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Test various chat interactions:
   - Simple questions
   - Supplier searches
   - Purchase requisition creation

4. Monitor console logs for debugging information

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your API key in environment variables
2. **402 Payment Required**: OpenRouter credits exhausted
3. **429 Too Many Requests**: Rate limiting - implement exponential backoff
4. **503 Service Unavailable**: OpenRouter service overloaded - retry after delay

### Debug Logging

Enable verbose logging by checking console outputs for:
- API configuration on startup
- Tool call triggers and responses
- Error messages with specific codes
- Request/response timing

## Future Enhancements

1. **Model Selection**: Allow dynamic model selection based on task complexity
2. **Streaming Responses**: Implement streaming for faster perceived response times
3. **Rate Limiting**: Add client-side rate limiting to prevent 429 errors
4. **Fallback Models**: Implement fallback to alternative models on errors
5. **Response Caching**: Cache common queries to reduce API calls

## References

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter API Reference](https://openrouter.ai/api/v1)
- [Grok Model Information](https://openrouter.ai/models/x-ai/grok-4-fast)
- [OpenAI API Format](https://platform.openai.com/docs/api-reference/chat)