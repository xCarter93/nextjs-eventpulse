# Structured Data Parsing for EventPulse AI Assistant

This document explains the structured data parsing implementation for the EventPulse AI Assistant.

## Overview

The structured data parsing system is a middle layer that intercepts user messages and converts them into structured data before passing them to the AI assistant. This approach makes tool calls more predictable and allows the AI to handle a wider range of user inputs.

## How It Works

1. When a user sends a message, the system first analyzes it using the `parseUserMessage` function.
2. This function determines which tool (if any) should be used based on the content of the message.
3. If a tool is identified, the system extracts relevant parameters from the message and formats them according to the tool's schema.
4. The structured data is then passed to the AI assistant along with the original message.
5. The AI assistant uses this structured data to make more accurate tool calls.

## Components

### 1. Structured Data Parser (`structured-data-parser.ts`)

This file contains the core functionality for parsing user messages into structured data:

- `determineToolToUse`: Determines which tool should be used based on the user's message
- `parseCreateRecipientData`: Extracts data for the createRecipient tool
- `parseSearchRecipientsData`: Extracts data for the searchRecipients tool
- `parseGetUpcomingEventsData`: Extracts data for the getUpcomingEvents tool with enhanced date parsing
- `parseUserMessage`: Main function that orchestrates the parsing process

### 2. Chat Route Integration (`chat/route.ts`)

The chat route has been updated to:

- Extract the last user message from the conversation
- Parse it into structured data using the `parseUserMessage` function
- Add a system message with the structured data if a tool was identified
- Pass the enhanced messages to the AI assistant

### 3. System Prompt Update (`ai-context.ts`)

The system prompt has been updated to inform the AI assistant about the structured data parsing system and how to use it.

### 4. Enhanced Date Parsing

The system now includes enhanced date parsing for the `getUpcomingEvents` tool:

- Natural language date expressions like "within a month from now" are converted to explicit start and end dates
- The date range is represented as a structured object with:
  - `description`: The original date range description from the user's message
  - `startDate`: The start date in ISO format (YYYY-MM-DD)
  - `endDate`: The end date in ISO format (YYYY-MM-DD)
  - `relativeDescription`: A human-readable description of the date range

## Benefits

- **More Accurate Tool Calls**: By parsing user messages into structured data, the system can more accurately determine which tool to use and with what parameters.
- **Better Natural Language Understanding**: The system can handle a wider range of natural language expressions, such as date ranges like "within a month from now".
- **Reduced Ambiguity**: The structured data provides clear guidance to the AI assistant, reducing ambiguity in tool usage.
- **Enhanced User Experience**: Users can express their requests in more natural ways and still get accurate responses.
- **Precise Date Handling**: The enhanced date parsing converts natural language date expressions into explicit dates, making event retrieval more accurate.

## Example

When a user asks "Show me all events happening in the next 30 days", the system:

1. Determines that the `getUpcomingEvents` tool should be used
2. Extracts and structures the date range with explicit start and end dates
3. Determines the event types to include ("all")
4. Passes this structured data to the AI assistant
5. The AI assistant uses this data to make an accurate tool call to the `getUpcomingEvents` tool

## Future Improvements

- Add more sophisticated date parsing for complex date expressions
- Expand the system to handle multiple tool calls in a single message
- Implement feedback loops to improve the accuracy of the parsing over time
- Add support for more tools as they are added to the system
- Enhance the structured data parsing for other tools (e.g., more detailed recipient information for the `createRecipient` tool)
