mod bindings;
mod protocol;
mod state;

use crate::bindings::exports::ntwk::theater::actor::Guest;
use crate::bindings::exports::ntwk::theater::http_handlers::Guest as HttpHandlersGuest;
use crate::bindings::exports::ntwk::theater::message_server_client::Guest as MessageServerClient;
use crate::bindings::exports::ntwk::theater::supervisor_handlers::Guest as SupervisorHandlersGuest;
use crate::bindings::ntwk::theater::http_framework::{
    add_route, create_server, enable_websocket, register_handler, start_server, ServerConfig,
};
use crate::bindings::ntwk::theater::http_types::{HttpRequest, HttpResponse, MiddlewareResult};
use crate::bindings::ntwk::theater::message_server_host::request;
use crate::bindings::ntwk::theater::runtime::log;
use crate::bindings::ntwk::theater::store;
use crate::bindings::ntwk::theater::supervisor::spawn;
use crate::bindings::ntwk::theater::timing::now;
use genai_types::Message;
use crate::bindings::ntwk::theater::types::ActorError;
use crate::bindings::ntwk::theater::websocket_types::{MessageType, WebsocketMessage};

use protocol::{
    create_conversation_created_message, create_conversation_response, create_error_message,
    create_messages_response, create_settings_response, create_success_response, ChatStateRequest,
    ChatStateResponse, ClientMessage, ServerMessage,
};
use serde::{Deserialize, Serialize};
use state::{
    add_connection, get_actor_id_for_conversation, initialize_state, register_conversation_actor,
    remove_connection, set_active_conversation, InterfaceState,
};

#[derive(Serialize, Deserialize, Debug)]
struct InitState {
    store_id: Option<String>,
}

use sha1::{Digest, Sha1};

struct Component;

impl Guest for Component {
    fn init(
        init_state_bytes: Option<Vec<u8>>,
        params: (String,),
    ) -> Result<(Option<Vec<u8>>,), String> {
        log("Initializing chat-interface HTTP actor");
        let (param,) = params;
        log(&format!("Init parameter: {}", param));

        let init_state = match init_state_bytes {
            Some(bytes) => match serde_json::from_slice::<InitState>(&bytes) {
                Ok(state) => state,
                Err(e) => return Err(format!("Failed to parse init state: {}", e)),
            },
            None => {
                log("No init state provided, using default");
                InitState { store_id: None }
            }
        };

        let store_id = match init_state.store_id {
            Some(id) => id,
            None => store::new().expect("Failed to create new store"),
        };

        let interface_state = initialize_state(&store_id);

        // Serialize state
        let state_bytes = match serde_json::to_vec(&interface_state) {
            Ok(bytes) => bytes,
            Err(e) => return Err(format!("Failed to serialize state: {}", e)),
        };

        // Set up HTTP server
        let config = ServerConfig {
            port: Some(interface_state.server_config.port as u16),
            host: Some(interface_state.server_config.host.clone()),
            tls_config: None,
        };

        // Create a new HTTP server
        let server_id = create_server(&config)?;
        log(&format!("Created server with ID: {}", server_id));

        // Register handlers
        // Make sure we use the EXACT names that match our exported trait implementation methods
        let api_handler_id = register_handler("handle_request")?;
        let ws_connect_handler_id = register_handler("handle_websocket_connect")?;
        let ws_message_handler_id = register_handler("handle_websocket_message")?;
        let ws_disconnect_handler_id = register_handler("handle_websocket_disconnect")?;

        log(&format!(
            "Registered handlers - API: {}, WebSocket Connect: {}, WebSocket Message: {}, WebSocket Disconnect: {}",
            api_handler_id, ws_connect_handler_id, ws_message_handler_id, ws_disconnect_handler_id
        ));

        // Add routes
        add_route(server_id, "/", "GET", api_handler_id)?;
        add_route(server_id, "/index.html", "GET", api_handler_id)?;
        add_route(server_id, "/styles.css", "GET", api_handler_id)?;
        add_route(server_id, "/bundle.js", "GET", api_handler_id)?;
        add_route(server_id, "/api/conversations", "GET", api_handler_id)?;
        add_route(server_id, "/api/health", "GET", api_handler_id)?;

        // Enable WebSocket support
        enable_websocket(
            server_id,
            "/ws",
            Some(ws_connect_handler_id),    // Connect handler
            ws_message_handler_id,          // Message handler
            Some(ws_disconnect_handler_id), // Disconnect handler
        )?;

        // Start the server
        let port = start_server(server_id)?;
        log(&format!("Server started on port {}", port));

        Ok((Some(state_bytes),))
    }
}

impl HttpHandlersGuest for Component {
    fn handle_request(
        state: Option<Vec<u8>>,
        params: (u64, HttpRequest),
    ) -> Result<(Option<Vec<u8>>, (HttpResponse,)), String> {
        let (handler_id, request) = params;
        log(&format!(
            "Handling HTTP request with handler ID: {}",
            handler_id
        ));
        log(&format!("Request URI: {}", request.uri));

        // Parse the URI to get the path and query
        let mut path_parts = request.uri.splitn(2, '?');
        let path = path_parts.next().unwrap_or("/");

        // Parse state
        let interface_state: InterfaceState = match state.clone() {
            Some(bytes) => match serde_json::from_slice(&bytes) {
                Ok(s) => s,
                Err(e) => return Err(format!("Failed to parse state: {}", e)),
            },
            None => return Err("Missing state".to_string()),
        };

        // Route handling
        let response = match path {
            "/" | "/index.html" => {
                // Serve HTML chat interface
                let html = include_str!("../assets/index.html");
                HttpResponse {
                    status: 200,
                    headers: vec![("Content-Type".to_string(), "text/html".to_string())],
                    body: Some(html.as_bytes().to_vec()),
                }
            }
            "/styles.css" => {
                // Serve CSS file
                let css = include_str!("../assets/styles.css");
                HttpResponse {
                    status: 200,
                    headers: vec![("Content-Type".to_string(), "text/css".to_string())],
                    body: Some(css.as_bytes().to_vec()),
                }
            }
            "/bundle.js" => {
                // Serve JavaScript file
                let js = include_str!("../assets/dist/bundle.js");
                HttpResponse {
                    status: 200,
                    headers: vec![(
                        "Content-Type".to_string(),
                        "application/javascript".to_string(),
                    )],
                    body: Some(js.as_bytes().to_vec()),
                }
            }
            "/api/conversations" => {
                // Return list of conversations
                let conversations: Vec<serde_json::Value> = interface_state
                    .conversation_metadata
                    .iter()
                    .map(|(id, meta)| {
                        serde_json::json!({
                            "id": id,
                            "title": meta.title,
                            "created_at": meta.created_at,
                            "updated_at": meta.updated_at,
                            "message_count": meta.message_count,
                            "last_message_preview": meta.last_message_preview
                        })
                    })
                    .collect();

                let json =
                    serde_json::to_string(&conversations).unwrap_or_else(|_| "[]".to_string());

                HttpResponse {
                    status: 200,
                    headers: vec![("Content-Type".to_string(), "application/json".to_string())],
                    body: Some(json.as_bytes().to_vec()),
                }
            }
            "/api/health" => {
                // Health check endpoint
                let health = serde_json::json!({
                    "status": "ok",
                    "connections": interface_state.connections.len(),
                    "conversations": interface_state.conversation_actors.len()
                });

                let json = serde_json::to_string(&health)
                    .unwrap_or_else(|_| "{\"status\":\"error\"}".to_string());

                HttpResponse {
                    status: 200,
                    headers: vec![("Content-Type".to_string(), "application/json".to_string())],
                    body: Some(json.as_bytes().to_vec()),
                }
            }
            _ => {
                // Not found
                HttpResponse {
                    status: 404,
                    headers: vec![("Content-Type".to_string(), "text/plain".to_string())],
                    body: Some("Not Found".as_bytes().to_vec()),
                }
            }
        };

        Ok((state, (response,)))
    }

    fn handle_middleware(
        state: Option<Vec<u8>>,
        params: (u64, HttpRequest),
    ) -> Result<(Option<Vec<u8>>, (MiddlewareResult,)), String> {
        let (handler_id, request) = params;
        log(&format!(
            "Handling middleware with handler ID: {}",
            handler_id
        ));

        // For now, just pass all requests through
        Ok((
            state,
            (MiddlewareResult {
                proceed: true,
                request,
            },),
        ))
    }

    fn handle_websocket_connect(
        state: Option<Vec<u8>>,
        params: (u64, u64, String, Option<String>),
    ) -> Result<(Option<Vec<u8>>,), String> {
        let (handler_id, connection_id, path, _query) = params;
        log(&format!(
            "WebSocket connected - Handler: {}, Connection: {}, Path: {}",
            handler_id, connection_id, path
        ));

        // Parse state
        let mut interface_state: InterfaceState = match state {
            Some(bytes) => match serde_json::from_slice(&bytes) {
                Ok(s) => s,
                Err(e) => return Err(format!("Failed to parse state: {}", e)),
            },
            None => return Err("Missing state".to_string()),
        };

        // Add connection to state
        add_connection(&mut interface_state, connection_id, now());

        // Serialize updated state
        let updated_state = match serde_json::to_vec(&interface_state) {
            Ok(bytes) => bytes,
            Err(e) => return Err(format!("Failed to serialize state: {}", e)),
        };

        Ok((Some(updated_state),))
    }

    fn handle_websocket_message(
        state: Option<Vec<u8>>,
        params: (u64, u64, WebsocketMessage),
    ) -> Result<(Option<Vec<u8>>, (Vec<WebsocketMessage>,)), String> {
        let (handler_id, connection_id, message) = params;
        log(&format!(
            "WebSocket message received - Handler: {}, Connection: {}",
            handler_id, connection_id
        ));

        // Parse state
        let mut interface_state: InterfaceState = match state {
            Some(bytes) => match serde_json::from_slice(&bytes) {
                Ok(s) => s,
                Err(e) => return Err(format!("Failed to parse state: {}", e)),
            },
            None => return Err("Missing state".to_string()),
        };

        // Extract message content
        let content = match message.ty {
            MessageType::Text => {
                String::from_utf8(message.text.expect("Text data is missing").into())
                    .unwrap_or_default()
            }
            MessageType::Binary => {
                String::from_utf8(message.data.expect("Binary data is missing")).unwrap_or_default()
            }
            _ => String::new(),
        };

        // Handle client message and get responses
        let response_messages =
            handle_client_message(&mut interface_state, connection_id, &content)?;

        // Serialize updated state
        let updated_state = match serde_json::to_vec(&interface_state) {
            Ok(bytes) => bytes,
            Err(e) => return Err(format!("Failed to serialize state: {}", e)),
        };

        Ok((Some(updated_state), (response_messages,)))
    }

    fn handle_websocket_disconnect(
        state: Option<Vec<u8>>,
        params: (u64, u64),
    ) -> Result<(Option<Vec<u8>>,), String> {
        let (handler_id, connection_id) = params;
        log(&format!(
            "WebSocket disconnected - Handler: {}, Connection: {}",
            handler_id, connection_id
        ));

        // Parse state
        let mut interface_state: InterfaceState = match state {
            Some(bytes) => match serde_json::from_slice(&bytes) {
                Ok(s) => s,
                Err(e) => return Err(format!("Failed to parse state: {}", e)),
            },
            None => return Err("Missing state".to_string()),
        };

        // Remove connection from state
        remove_connection(&mut interface_state, connection_id);

        // Serialize updated state
        let updated_state = match serde_json::to_vec(&interface_state) {
            Ok(bytes) => bytes,
            Err(e) => return Err(format!("Failed to serialize state: {}", e)),
        };

        Ok((Some(updated_state),))
    }
}

impl MessageServerClient for Component {
    // Default implementations for message server client
    fn handle_send(
        state: Option<Vec<u8>>,
        params: (Vec<u8>,),
    ) -> Result<(Option<Vec<u8>>,), String> {
        log("Handling send message");
        let (data,) = params;
        log(&format!("Received data: {:?}", data));
        Ok((state,))
    }

    fn handle_request(
        state: Option<Vec<u8>>,
        params: (String, Vec<u8>),
    ) -> Result<(Option<Vec<u8>>, (Option<Vec<u8>>,)), String> {
        log("Handling request message");
        let (request_id, data) = params;
        log(&format!(
            "[req id] {} [data] {}",
            request_id,
            String::from_utf8(data.clone()).unwrap_or_else(|_| "Invalid UTF-8".to_string())
        ));

        Ok((state, (Some(data),)))
    }

    fn handle_channel_open(
        state: Option<bindings::exports::ntwk::theater::message_server_client::Json>,
        params: (bindings::exports::ntwk::theater::message_server_client::Json,),
    ) -> Result<
        (
            Option<bindings::exports::ntwk::theater::message_server_client::Json>,
            (bindings::exports::ntwk::theater::message_server_client::ChannelAccept,),
        ),
        String,
    > {
        log("Handling channel open message");
        log(&format!("Channel open message: {:?}", params));
        Ok((
            state,
            (
                bindings::exports::ntwk::theater::message_server_client::ChannelAccept {
                    accepted: true,
                    message: None,
                },
            ),
        ))
    }

    fn handle_channel_close(
        state: Option<bindings::exports::ntwk::theater::message_server_client::Json>,
        params: (String,),
    ) -> Result<(Option<bindings::exports::ntwk::theater::message_server_client::Json>,), String>
    {
        log("Handling channel close message");
        log(&format!("Channel close message: {:?}", params));
        Ok((state,))
    }

    fn handle_channel_message(
        state: Option<bindings::exports::ntwk::theater::message_server_client::Json>,
        params: (
            String,
            bindings::exports::ntwk::theater::message_server_client::Json,
        ),
    ) -> Result<(Option<bindings::exports::ntwk::theater::message_server_client::Json>,), String>
    {
        log("Received channel message");
        log(&format!("Channel message: {:?}", params));
        Ok((state,))
    }
}

impl SupervisorHandlersGuest for Component {
    fn handle_child_error(
        state: Option<Vec<u8>>,
        params: (String, ActorError),
    ) -> Result<(Option<Vec<u8>>,), String> {
        log("Handling child error");
        let (child_id, error) = params;
        log(&format!("Child ID: {}, Error: {:?}", child_id, error));
        Ok((state,))
    }
}

// Handle client messages from WebSocket connections
fn handle_client_message(
    interface_state: &mut InterfaceState,
    connection_id: u64,
    content: &str,
) -> Result<Vec<WebsocketMessage>, String> {
    // Parse client message
    log(&format!("Parsing client message: {}", content));
    let client_message: ClientMessage = match serde_json::from_str(content) {
        Ok(msg) => msg,
        Err(e) => {
            log(&format!("Failed to parse client message: {}", e));
            let error_msg =
                create_error_message("", &format!("Invalid message format: {}", e), "PARSE_ERROR");
            return Ok(vec![create_websocket_text_message(&error_msg)?]);
        }
    };

    // Handle different actions
    match client_message {
        ClientMessage::NewConversation => {
            // Generate a new conversation ID
            let conversation_id = generate_conversation_id(content);

            // Start a new chat-state actor
            let chat_state_actor_id =
                start_chat_state_actor(&conversation_id, &interface_state.store_id)?;

            log(&format!(
                "Started chat-state actor for conversation {}: {}",
                conversation_id, chat_state_actor_id
            ));

            // Associate connection with conversation
            set_active_conversation(
                interface_state,
                connection_id,
                conversation_id.clone(),
                now(),
            );

            // Register the conversation actor
            register_conversation_actor(
                interface_state,
                conversation_id.clone(),
                chat_state_actor_id,
                format!("Conversation {}", &conversation_id[..8]),
                now(),
            );

            // Send confirmation to client
            let response_msg = create_conversation_created_message(&conversation_id);
            return Ok(vec![create_websocket_text_message(&response_msg)?])
        }
        ClientMessage::SendMessage {
            conversation_id,
            message,
        } => {
            // Get actor ID for this conversation
            let actor_id = match get_actor_id_for_conversation(interface_state, &conversation_id) {
                Some(id) => id,
                None => {
                    let error_msg = create_error_message(
                        &conversation_id,
                        "Conversation not found",
                        "CONVERSATION_NOT_FOUND",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
            };

            let chat_state_msg = ChatStateRequest::AddMessage { message };

            // Send to chat-state actor
            let response = forward_to_chat_state(&actor_id, &chat_state_msg)?;

            match response {
                ChatStateResponse::Success => {
                    let completion_response =
                        forward_to_chat_state(&actor_id, &ChatStateRequest::GenerateCompletion)?;

                    match completion_response {
                        // In the new chain-driven architecture, GenerateCompletion returns a Head response
                        // with the ID of the latest message in the chain
                        ChatStateResponse::Head { head: _ } => {
                            // Now request the full updated conversation history
                            let history_response = forward_to_chat_state(
                                &actor_id, 
                                &ChatStateRequest::GetHistory
                            )?;
                            
                            match history_response {
                                ChatStateResponse::History { messages } => {
                                    // Convert ChatMessage objects to Message objects for client compatibility
                                    let client_messages: Vec<Message> = messages.iter()
                                        .map(|m| m.message.clone())
                                        .collect();
                                    
                                    let response_msg = create_messages_response(&conversation_id, client_messages);
                                    return Ok(vec![create_websocket_text_message(&response_msg)?]);
                                },
                                ChatStateResponse::Error { error } => {
                                    let error_msg = create_error_message(
                                        &conversation_id,
                                        &format!("Error from chat-state actor: {:?}", error),
                                        "CHAT_STATE_ERROR",
                                    );
                                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                                },
                                _ => {
                                    let error_msg = create_error_message(
                                        &conversation_id,
                                        "Unexpected response when retrieving message history",
                                        "INTERNAL_ERROR",
                                    );
                                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                                }
                            }
                        },
                        // Handle the old completion response format for backwards compatibility
                        ChatStateResponse::Completion { messages } => {
                            let response_msg = create_messages_response(&conversation_id, messages);
                            return Ok(vec![create_websocket_text_message(&response_msg)?]);
                        },
                        ChatStateResponse::Error { error } => {
                            let error_msg = create_error_message(
                                &conversation_id,
                                &format!("Error from chat-state actor: {:?}", error),
                                "CHAT_STATE_ERROR",
                            );
                            return Ok(vec![create_websocket_text_message(&error_msg)?]);
                        },
                        _ => {
                            let error_msg = create_error_message(
                                &conversation_id,
                                "Unexpected response from chat-state actor",
                                "INTERNAL_ERROR",
                            );
                            return Ok(vec![create_websocket_text_message(&error_msg)?]);
                        }
                    }
                }
                _ => {
                    let error_msg = create_error_message(
                        &conversation_id,
                        "Unexpected response from chat-state actor",
                        "INTERNAL_ERROR",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
            }
        }
        ClientMessage::ListConversations => {
            let response = ServerMessage::ConversationList {
                conversations: interface_state.conversation_metadata.clone(),
            };

            return Ok(vec![create_websocket_text_message(&response)?])
        }
        ClientMessage::GetSettings { conversation_id } => {
            log(&format!(
                "Getting settings for conversation: {}",
                conversation_id
            ));
            // Get actor ID for this conversation
            let actor_id = match get_actor_id_for_conversation(interface_state, &conversation_id) {
                Some(id) => id,
                None => {
                    let error_msg = create_error_message(
                        &conversation_id,
                        "Conversation not found",
                        "CONVERSATION_NOT_FOUND",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
            };

            log("Actor ID found, forwarding request to chat-state actor");

            // Forward request to chat-state actor
            let chat_state_msg = ChatStateRequest::GetSettings;
            let response = forward_to_chat_state(&actor_id, &chat_state_msg)?;
            log(&format!(
                "Received settings response for conversation {}: {:?}",
                conversation_id, response
            ));
            match response {
                ChatStateResponse::Settings { settings } => {
                    log(&format!(
                        "Settings recieved for conversation {}",
                        conversation_id
                    ));
                    let response_msg = create_settings_response(&conversation_id, settings);
                    return Ok(vec![create_websocket_text_message(&response_msg)?]);
                }
                ChatStateResponse::Error { error } => {
                    log(&format!(
                        "Error from chat-state actor for conversation {}: {:?}",
                        conversation_id, error
                    ));
                    let error_msg = create_error_message(
                        &conversation_id,
                        &format!("Error from chat-state actor: {:?}", error),
                        "CHAT_STATE_ERROR",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
                _ => {
                    log(&format!(
                        "Unexpected response from chat-state actor for conversation {}: {:?}",
                        conversation_id, response
                    ));
                    let error_msg = create_error_message(
                        &conversation_id,
                        "Unexpected response from chat-state actor",
                        "INTERNAL_ERROR",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
            }
        }
        ClientMessage::UpdateSettings {
            conversation_id,
            settings,
        } => {
            // Get actor ID for this conversation
            let actor_id = match get_actor_id_for_conversation(interface_state, &conversation_id) {
                Some(id) => id,
                None => {
                    let error_msg = create_error_message(
                        &conversation_id,
                        "Conversation not found",
                        "CONVERSATION_NOT_FOUND",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
            };

            // Forward request to chat-state actor
            let chat_state_msg = ChatStateRequest::UpdateSettings { settings };
            let response = forward_to_chat_state(&actor_id, &chat_state_msg)?;
            match response {
                ChatStateResponse::Success => {
                    let success_msg = create_success_response();
                    return Ok(vec![create_websocket_text_message(&success_msg)?]);
                }
                ChatStateResponse::Error { error } => {
                    let error_msg = create_error_message(
                        &conversation_id,
                        &format!("Error from chat-state actor: {:?}", error),
                        "CHAT_STATE_ERROR",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
                _ => {
                    let error_msg = create_error_message(
                        &conversation_id,
                        "Unexpected response from chat-state actor",
                        "INTERNAL_ERROR",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
            }
        }
        ClientMessage::GetConversation { conversation_id } => {
            // Get actor ID for this conversation
            let actor_id = match get_actor_id_for_conversation(interface_state, &conversation_id) {
                Some(id) => id,
                None => {
                    let error_msg = create_error_message(
                        &conversation_id,
                        "Conversation not found",
                        "CONVERSATION_NOT_FOUND",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
            };

            // Request the head ID first to confirm we have a valid conversation
            let head_response = forward_to_chat_state(
                &actor_id, 
                &ChatStateRequest::GetHead
            )?;
            
            match head_response {
                ChatStateResponse::Head { head: _ } => {
                    // Now request the full message history
                    let history_response = forward_to_chat_state(
                        &actor_id, 
                        &ChatStateRequest::GetHistory
                    )?;
                    
                    match history_response {
                        ChatStateResponse::History { messages } => {
                            // Convert ChatMessage objects to Message objects for client compatibility
                            let client_messages: Vec<Message> = messages.iter()
                                .map(|m| m.message.clone())
                                .collect();
                                
                            let response_msg = create_conversation_response(&conversation_id, client_messages);
                            return Ok(vec![create_websocket_text_message(&response_msg)?]);
                        },
                        ChatStateResponse::Error { error } => {
                            let error_msg = create_error_message(
                                &conversation_id,
                                &format!("Error from chat-state actor: {:?}", error),
                                "CHAT_STATE_ERROR",
                            );
                            return Ok(vec![create_websocket_text_message(&error_msg)?]);
                        },
                        _ => {
                            let error_msg = create_error_message(
                                &conversation_id,
                                "Unexpected response when retrieving message history",
                                "INTERNAL_ERROR",
                            );
                            return Ok(vec![create_websocket_text_message(&error_msg)?]);
                        }
                    }
                },
                ChatStateResponse::Error { error } => {
                    let error_msg = create_error_message(
                        &conversation_id,
                        &format!("Error from chat-state actor: {:?}", error),
                        "CHAT_STATE_ERROR",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                },
                _ => {
                    let error_msg = create_error_message(
                        &conversation_id,
                        "Unexpected response from chat-state actor",
                        "INTERNAL_ERROR",
                    );
                    return Ok(vec![create_websocket_text_message(&error_msg)?]);
                }
            }
        }
    }
    
    ClientMessage::GetMessageById { conversation_id, message_id } => {
        // Get actor ID for this conversation
        let actor_id = match get_actor_id_for_conversation(interface_state, &conversation_id) {
            Some(id) => id,
            None => {
                let error_msg = create_error_message(
                    &conversation_id,
                    "Conversation not found",
                    "CONVERSATION_NOT_FOUND",
                );
                return Ok(vec![create_websocket_text_message(&error_msg)?]);
            }
        };

        // Forward request to chat-state actor
        let chat_state_msg = ChatStateRequest::GetMessage { message_id };
        let response = forward_to_chat_state(&actor_id, &chat_state_msg)?;

        match response {
            ChatStateResponse::ChatMessage { message } => {
                let response_msg = create_message_by_id_response(&conversation_id, message);
                return Ok(vec![create_websocket_text_message(&response_msg)?])
            },
            ChatStateResponse::Error { error } => {
                let error_msg = create_error_message(
                    &conversation_id,
                    &format!("Error retrieving message: {:?}", error),
                    "MESSAGE_ERROR",
                );
                return Ok(vec![create_websocket_text_message(&error_msg)?])
            },
            _ => {
                let error_msg = create_error_message(
                    &conversation_id,
                    "Unexpected response when retrieving message",
                    "INTERNAL_ERROR",
                );
                return Ok(vec![create_websocket_text_message(&error_msg)?])
            }
        }
    },
    
    ClientMessage::GetHeadId { conversation_id } => {
        // Get actor ID for this conversation
        let actor_id = match get_actor_id_for_conversation(interface_state, &conversation_id) {
            Some(id) => id,
            None => {
                let error_msg = create_error_message(
                    &conversation_id,
                    "Conversation not found",
                    "CONVERSATION_NOT_FOUND",
                );
                return Ok(vec![create_websocket_text_message(&error_msg)?]);
            }
        };

        // Forward request to chat-state actor
        let chat_state_msg = ChatStateRequest::GetHead;
        let response = forward_to_chat_state(&actor_id, &chat_state_msg)?;

        match response {
            ChatStateResponse::Head { head } => {
                let response_msg = create_head_id_response(&conversation_id, &head);
                return Ok(vec![create_websocket_text_message(&response_msg)?])
            },
            ChatStateResponse::Error { error } => {
                let error_msg = create_error_message(
                    &conversation_id,
                    &format!("Error retrieving head: {:?}", error),
                    "HEAD_ERROR",
                );
                return Ok(vec![create_websocket_text_message(&error_msg)?])
            },
            _ => {
                let error_msg = create_error_message(
                    &conversation_id,
                    "Unexpected response when retrieving head",
                    "INTERNAL_ERROR",
                );
                return Ok(vec![create_websocket_text_message(&error_msg)?])
            }
        }
    }
}

// Start a new chat-state actor for a conversation
fn start_chat_state_actor(conversation_id: &str, store_id: &str) -> Result<String, String> {
    // Chat-state actor manifest path
    let manifest_path = "/Users/colinrozzi/work/actor-registry/chat-state/manifest.toml";

    // Prepare initial state (serialized as JSON)
    let initial_state = serde_json::json!({
        "conversation_id": conversation_id,
        "store_id": store_id,
    });

    // Spawn the actor
    let actor_id = spawn(manifest_path, Some(initial_state.to_string().as_bytes()))?;
    log(&format!("Spawned chat-state actor with ID: {}", actor_id));

    Ok(actor_id)
}

// Forward a message to a chat-state actor
fn forward_to_chat_state(
    actor_id: &str,
    req: &ChatStateRequest,
) -> Result<ChatStateResponse, String> {
    // Serialize the message
    let req_bytes = match serde_json::to_vec(req) {
        Ok(bytes) => bytes,
        Err(e) => return Err(format!("Failed to serialize message: {}", e)),
    };

    // Send request to chat-state actor
    let response_bytes = match request(actor_id, &req_bytes) {
        Ok(response) => response,
        Err(e) => return Err(format!("Failed to send request to chat-state actor: {}", e)),
    };

    // Parse response
    match serde_json::from_slice::<ChatStateResponse>(&response_bytes) {
        Ok(response) => Ok(response),
        Err(e) => Err(format!("Failed to parse response: {}", e)),
    }
}

// Create a WebSocket text message from a ServerMessage
fn create_websocket_text_message(message: &ServerMessage) -> Result<WebsocketMessage, String> {
    match serde_json::to_string(message) {
        Ok(text) => Ok(WebsocketMessage {
            ty: MessageType::Text,
            text: Some(text.into()),
            data: None,
        }),
        Err(e) => Err(format!("Failed to serialize server message: {}", e)),
    }
}

// Generate a unique conversation ID
fn generate_conversation_id(string: impl AsRef<[u8]>) -> String {
    // Get current timestamp
    let timestamp = now();

    // Create a unique hash
    let mut sha1 = Sha1::new();
    sha1.update(string.as_ref());
    sha1.update(timestamp.to_string().as_bytes());
    let hash = sha1.finalize();
    let hash_str = hex::encode(hash);

    // Format with timestamp for better identification
    format!("conv-{}-{}", timestamp, hash_str)
}

bindings::export!(Component with_types_in bindings);
