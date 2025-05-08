# Debugging Guide for Chat Interface Actor

This guide provides steps to verify that the fixes for the WebSocket message handling and source map issues are working correctly.

## Verifying the Fixes

After building and restarting the actor, follow these steps to verify the fixes:

### 1. Check Source Map Loading

1. Open DevTools in your browser (F12 or Right-click > Inspect)
2. Go to the Network tab
3. Navigate to http://localhost:8080/
4. Look for `bundle.js.map` in the network requests
   - It should return a 200 OK status code
   - Previously it was returning a 404 error

### 2. Check WebSocket Message Handling

1. Open the browser console (Console tab in DevTools)
2. Clear the console for a clean view
3. Refresh the page
4. You should see:
   - "Connecting to WebSocket: ws://localhost:8080/ws"
   - "WebSocket connection established"
   - "WebSocket connected"
   - "Received message: {type: 'conversation_list', conversations: {...}}"
   - No "Unknown message type: undefined" errors should appear

### 3. Test Creating a New Conversation

1. Click the "New Chat" button
2. Watch the console output
3. You should see:
   - "Received message: {type: 'conversation_created', conversation_id: ...}"
   - No errors about unknown message types

### 4. Test Sending a Message

1. Type a message in the input field and send it
2. Watch the console output
3. You should see:
   - "Received message: {type: 'messages', conversation_id: ...}"
   - The message appears in the conversation view
   - No errors in the console

## Troubleshooting

If you're still experiencing issues:

1. **Messages not showing up correctly**:
   - Check the browser console for any remaining type errors
   - Verify that the message structure in the backend matches what we've updated in the frontend

2. **Source map still not loading**:
   - Confirm the route is correctly registered in `lib.rs`
   - Check that the path to the source map file is correct: `include_str!("../assets/dist/bundle.js.map")`

3. **Console errors during startup**:
   - If you see errors about properties not being defined, there might be additional message structure mismatches

## Conclusion

The fixes implemented should address all the WebSocket message handling issues and source map loading problems. If you encounter any additional issues, review the message structures in both the frontend and backend code to ensure they're fully aligned.
