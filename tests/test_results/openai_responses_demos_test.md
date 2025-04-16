# OpenAI Responses API Test Report

**Test Date:** 2025-04-15T19:33:34.723Z

## Test Results Summary

- Total Tests: 3
- Successful: 2
- Failed: 1

## Detailed Test Results

### Test 1: Demo 1: Simple text response

- **Status:** ✅ Success
- **Input:** What is the capital of France?
- **Output:** [object Object]

### Test 2: Demo 2: Multimodal response with image

- **Status:** ✅ Success
- **Input:** Image analysis of basketball game
- **Output:** [object Object]

### Test 3: Demo 3: Response with reasoning

- **Status:** ❌ Failed
- **Error:** 400 Unknown parameter: 'reasoning.type'.

## API Compatibility Assessment

Based on the test results, the OpenAI Responses API is not fully compatible with the current OpenAI SDK (v4.94.0).

### Issues Identified:

- Demo 3: Response with reasoning: 400 Unknown parameter: 'reasoning.type'.
