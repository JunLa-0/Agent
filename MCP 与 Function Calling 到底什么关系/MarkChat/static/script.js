document.addEventListener('DOMContentLoaded', () => {
    const chatbox = document.getElementById('chatbox');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

    let toolDetailsCounter = 0; // For unique IDs for tool parameter toggles

    function addMessageToChat(sender, text, toolDetails = null) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        const senderSpan = document.createElement('span');
        senderSpan.classList.add('sender');
        senderSpan.textContent = `${sender}:`;

        const contentSpan = document.createElement('span');
        contentSpan.classList.add('content');
        contentSpan.textContent = text; // Use textContent for security

        messageDiv.appendChild(senderSpan);
        messageDiv.appendChild(contentSpan);

        if (sender.toLowerCase() === 'you') {
            messageDiv.classList.add('user-message');
        } else if (sender.toLowerCase() === 'ai') {
            messageDiv.classList.add('ai-message');
        } else {
            messageDiv.classList.add('system-message');
        }

        chatbox.appendChild(messageDiv);

        if (toolDetails && toolDetails.name) {
            toolDetailsCounter++;
            const detailsId = `tool-details-${toolDetailsCounter}`;

            const toolInfoDiv = document.createElement('div');
            toolInfoDiv.classList.add('tool-info');

            const moreButton = document.createElement('button');
            moreButton.classList.add('more-button');
            moreButton.textContent = '显示工具调用信息';
            moreButton.onclick = () => showToolDialog(detailsId, toolDetails);
            toolInfoDiv.appendChild(moreButton);

            // Create a hidden div to store tool details for the dialog
            const detailsDiv = document.createElement('div');
            detailsDiv.id = detailsId;
            detailsDiv.classList.add('tool-details-container');
            detailsDiv.style.display = 'none';
            toolInfoDiv.appendChild(detailsDiv);
            
            messageDiv.appendChild(toolInfoDiv);
        }

        chatbox.scrollTop = chatbox.scrollHeight; // Scroll to bottom
    }

    // Function to show tool details in a dialog
    function showToolDialog(detailsId, toolDetails) {
        // Remove any existing dialog
        const existingDialog = document.querySelector('.tool-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // Create dialog container
        const dialogContainer = document.createElement('div');
        dialogContainer.classList.add('tool-dialog');
        
        // Create dialog content
        const dialogContent = document.createElement('div');
        dialogContent.classList.add('tool-dialog-content');
        
        // Add title
        const dialogTitle = document.createElement('h3');
        dialogTitle.textContent = `Tool: ${toolDetails.name}`;
        dialogContent.appendChild(dialogTitle);
        
        // Add parameters section
        if (toolDetails.parameters) {
            const paramsTitle = document.createElement('h4');
            paramsTitle.textContent = 'Parameters';
            dialogContent.appendChild(paramsTitle);
            
            const paramsPre = document.createElement('pre');
            paramsPre.classList.add('tool-parameters');
            try {
                paramsPre.textContent = JSON.stringify(toolDetails.parameters, null, 2);
            } catch (e) {
                paramsPre.textContent = "Error displaying parameters.";
            }
            dialogContent.appendChild(paramsPre);
        }
        
        // Add result section
        if (toolDetails.result) {
            const resultTitle = document.createElement('h4');
            resultTitle.textContent = 'Result';
            dialogContent.appendChild(resultTitle);
            
            const resultPre = document.createElement('pre');
            resultPre.classList.add('tool-result');
            resultPre.textContent = toolDetails.result;
            dialogContent.appendChild(resultPre);
        }
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.classList.add('dialog-close-button');
        closeButton.onclick = () => dialogContainer.remove();
        dialogContent.appendChild(closeButton);
        
        // Add dialog to container and append to body
        dialogContainer.appendChild(dialogContent);
        document.body.appendChild(dialogContainer);
    }

    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (!messageText) return;

        addMessageToChat('You', messageText);
        userInput.value = '';
        sendButton.disabled = true; // Disable button during processing

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: messageText }),
            });

            sendButton.disabled = false; // Re-enable button

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ final_response: `HTTP error! status: ${response.status}`}));
                addMessageToChat('System', `Error: ${errorData.final_response || errorData.error || 'Unknown error'}`);
                return;
            }

            const data = await response.json();

            if (data.error && !data.final_response) { // Error before final response
                 addMessageToChat('System', `Error: ${data.error}`);
            }

            if (data.tool_name) {
                let aiMessage = `使用工具：${data.tool_name}`;
                const toolInfo = { 
                    name: data.tool_name,
                    parameters: data.tool_parameters,
                    result: data.tool_result 
                };
                
                addMessageToChat('AI', aiMessage, toolInfo);

                if (data.tool_executed) {
                    // Optionally display raw tool result, or just wait for final LLM summary
                    // addMessageToChat('System', `Tool '${data.tool_name}' executed.`);
                } else if (data.error && !data.final_response) { // Error during tool execution
                    addMessageToChat('System', `Error with tool '${data.tool_name}': ${data.error}`);
                }
            }

            if (data.final_response) {
                addMessageToChat('AI', data.final_response);
            } else if (data.error && !data.tool_name) { // General error not related to tool choice
                addMessageToChat('System', `Error: ${data.error}`);
            }


        } catch (error) {
            console.error('Fetch error:', error);
            addMessageToChat('System', `Network or unexpected error: ${error.message}`);
            sendButton.disabled = false;
        }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});