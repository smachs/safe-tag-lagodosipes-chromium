let isHandled = false; // Flag to ensure we only handle the page once

// Set up a lighter MutationObserver just to wait for "Entrada" to appear
const observer = new MutationObserver(() => {
  const entradaSpan = document.querySelector('span[data-v-27ffe136][title="Entrada"]');
  
  if (entradaSpan && !isHandled) {
    isHandled = true; // Set flag to prevent multiple handling
    observer.disconnect(); // Stop observing once we find it
    console.log('Found page - initializing auto sync handlers');
    handleEntradaPage();
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

function handleEntradaPage() {
  // Watch for the given-name input
  const givenNameInput = document.querySelector('.given-name-item input.el-input__inner');

  // Watch for the surname input with specific class structure
  const givenSurnameInput = document.querySelector('.search_hcp_visitor-panel .el-input__inner');

  // Watch for the Visitado (Visited) input with more specific selector
  const visitedInput = document.querySelector('div[data-v-de849942][data-v-e10c82a2].search-person-panel input.el-input__inner[placeholder="Pesquisar"]');
  if (visitedInput) {
    visitedInput.addEventListener('input', (event) => {
      const residentName = event.target.value;
      
      let residentAddress = "Rua das Flores, 123"; // default value
      const match = residentName.match(/\[([A-Z]\d{1,2})/);
      if (match) {
        residentAddress = match[1].replace(/([A-Z])(\d+)/, '$1 $2');
        console.log('Extracted address:', residentAddress);
      } else {
        console.log('No address pattern found in:', residentName);
      }
    });
  }

  // Look for input field that would likely contain phone number
  const phoneInput = document.querySelector('input[tips*="São permitidos de 1 a 32 caracteres, incluindo dígitos"]') ||
                    document.querySelector('input[tips*="dígitos"]');

  // Look for both "Entrar e continuar" and "Entrar" buttons
  const continueButton = document.querySelector('button[title="Dar entrada e continuar"][data-v-eb02dcfc]');
  const startButton = document.querySelector('button[title="Entrada"][data-v-eb02dcfc]');

  // Disable the startButton if found
  if (startButton) {
    startButton.disabled = true;
    startButton.classList.add('is-disabled');
    // console.log('Start button disabled');

    // Prevent any click events
    startButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true); // Using capture phase to ensure we catch the event first
  }

  if (continueButton) {
    continueButton.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Continue button clicked');
      
      // Get the current values
      const guestPhone = phoneInput ? phoneInput.value : '';
      const guestName = givenNameInput ? givenNameInput.value : ''; 
      const surname = givenSurnameInput ? givenSurnameInput.value.trim() : '';
      const residentName = visitedInput ? visitedInput.value : '';

      if (guestPhone === '') {
        // console.log('No phone number found');
        
        // Send error to Discord webhook for empty phone
        const webhookUrl = "https://discord.com/api/webhooks/1332114452979515454/-kT_hyZVSFKWo1-TyFY6damkNHAzAVDpbLzJijg4YXZ3Tx18WXd8XOOS5aUrm1tSZfng";
        
        try {
          // Format date in PT-BR timezone and format
          const errorDate = new Date().toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: "⚠️ Empty Phone Number Alert via Auto Sync",
              embeds: [{
                title: "Missing Phone Number",
                description: "Attempted to create token without phone number",
                color: 16776960, // Yellow color for warning
                fields: [
                  {
                    name: "Guest Name",
                    value: surname ? `${guestName} ${surname}` : guestName || "Not provided",
                    inline: true
                  },
                  {
                    name: "Resident Name",
                    value: residentName || "Not provided",
                    inline: true
                  },
                  {
                    name: "Resident Address",
                    value: residentName ? residentName.match(/\[([A-Z]\d{1,2})/)[1].replace(/([A-Z])(\d+)/, '$1 $2') : "Not provided",
                    inline: true
                  },
                  {
                    name: "Timestamp",
                    value: errorDate,
                    inline: false
                  }
                ]
              }]
            })
          });
          console.log('Phone number error sent to Sentinel');
        } catch (webhookError) {
          console.error('Failed to send phone error to Sentinel:', webhookError);
        }
        return;
      }
      
      // Continue with the rest of the code if phone number exists
      const fullGuestName = surname ? `${guestName} ${surname}` : guestName;
      
      let residentAddress = "Rua das Flores, 123"; // default value
      const match = residentName.match(/\[([A-Z]\d{1,2})/);
      if (match) {
        residentAddress = match[1].replace(/([A-Z])(\d+)/, '$1 $2');
        // console.log('Extracted address:', residentAddress);
      }
      
      // console.log('Current phone number:', guestPhone);
      // console.log('Current guest name:', fullGuestName);
      // console.log('Resident address:', residentAddress);

      let apiUrl = "https://safe-tag-check-route-853432718953.southamerica-east1.run.app/";        
      try {
        const createToken = await fetch(apiUrl + 'create-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guest_display_name: fullGuestName,
            guest_phone_number: guestPhone,
            resident_display_name: residentName,
            resident_address: residentAddress,
            owner_id: "DMPqzoBw8ZnvvRTzLnK1",
            description: "Rastreador criado via Auto Sync.",
            deviceId: "zhJBQCUTzofhbH0lcEdCTBRY0BL2"
          })
        });

        if (!createToken.ok) {
          throw new Error(`HTTP error! status: ${createToken.status}`);
        }

        const visitResult = await createToken.json();
        console.log('Visit created:', visitResult);

        // Show success confirmation
        const confirmed = confirm('✅ Rastreador criado com sucesso! Clique em OK para atualizar a página.');
        
        if (confirmed) {
          // console.log('User confirmed, sending success message...');
          
          // Send success message to Discord
          const webhookUrl = "https://discord.com/api/webhooks/1332114452979515454/-kT_hyZVSFKWo1-TyFY6damkNHAzAVDpbLzJijg4YXZ3Tx18WXd8XOOS5aUrm1tSZfng";
          
          try {
            // Format date in PT-BR timezone and format
            const successDate = new Date().toLocaleString('pt-BR', { 
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: "✅ Token Created Successfully via Auto Sync",
                embeds: [{
                  title: "New Token Details",
                  description: "A new token was successfully created",
                  color: 5763719, // Green color for success
                  fields: [
                    {
                      name: "Guest Name",
                      value: fullGuestName || "Not provided",
                      inline: true
                    },
                    {
                      name: "Guest Phone",
                      value: guestPhone || "Not provided",
                      inline: true
                    },
                    {
                      name: "Resident Name",
                      value: residentName || "Not provided",
                      inline: true
                    },
                    {
                      name: "Resident Address",
                      value: residentAddress || "Not provided",
                      inline: true
                    },
                    {
                      name: "Token ID",
                      value: visitResult.tokenId || "Not available",
                      inline: true
                    },
                    {
                      name: "Timestamp",
                      value: successDate,
                      inline: false
                    }
                  ]
                }]
              })
            });
            console.log('Success message sent to Sentinel');
            
            // Refresh page after 1 second
            // console.log('Refreshing page in 1 second...');
            setTimeout(() => {
              window.location.reload();
            }, 1000);

          } catch (webhookError) {
            console.error('Failed to send success message to Sentinel:', webhookError);
          }
        } else {
          // console.log('User cancelled page refresh');
        }

      } catch (error) {
        console.error('Error sending token to API:', error);
        // Send error to Sentinel
        const webhookUrl = "https://discord.com/api/webhooks/1332114452979515454/-kT_hyZVSFKWo1-TyFY6damkNHAzAVDpbLzJijg4YXZ3Tx18WXd8XOOS5aUrm1tSZfng";
        
        try {
          // Format date in PT-BR timezone and format
          const errorDate = new Date().toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: "❌ Error creating token via Auto Sync",
              embeds: [{
                title: "API Error Details",
                color: 15158332, // Red color
                fields: [
                  {
                    name: "Error Message",
                    value: error.message || "Unknown error",
                    inline: false
                  },
                  {
                    name: "Guest Name",
                    value: fullGuestName || "Not provided",
                    inline: true
                  },
                  {
                    name: "Guest Phone",
                    value: guestPhone || "Not provided",
                    inline: true
                  },
                  {
                    name: "Resident Name",
                    value: residentName || "Not provided",
                    inline: true
                  },
                  {
                    name: "Resident Address",
                    value: residentAddress || "Not provided",
                    inline: true
                  },
                  {
                    name: "Timestamp",
                    value: errorDate,
                    inline: false
                  }
                ]
              }]
            })
          });
          console.log('Error sent to Sentinel');
        } catch (webhookError) {
          console.error('Failed to send error to Sentinel:', webhookError);
        }
      }
    });
  } else {
    console.log('Could not find continue button');
    
    // Send connection error to Discord webhook
    const webhookUrl = "https://discord.com/api/webhooks/1332114452979515454/-kT_hyZVSFKWo1-TyFY6damkNHAzAVDpbLzJijg4YXZ3Tx18WXd8XOOS5aUrm1tSZfng";
    
    try {
      // Format date in PT-BR timezone and format
      const errorDate = new Date().toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: "🔌 Auto Sync Connection Alert",
          embeds: [{
            title: "Connection Status Check",
            description: "Unable to establish connection with the HikCentral",
            color: 3447003, // Blue color for info
            fields: [
              {
                name: "Status",
                value: "❌ Button Not Found",
                inline: true
              },
              {
                name: "Element Selector",
                value: "`button[title='Dar entrada e continuar'][data-v-eb02dcfc]`",
                inline: true
              },
              {
                name: "Page Check",
                value: document.querySelector('span[data-v-27ffe136][title="Entrada"]') ? "✅ On Entrada Page" : "❌ Not on Entrada Page",
                inline: true
              },
              {
                name: "DOM Ready",
                value: document.readyState,
                inline: true
              },
              {
                name: "Auto Sync Version",
                value: "v1.0.0",
                inline: true
              },
              {
                name: "Timestamp",
                value: errorDate,
                inline: false
              }
            ],
            footer: {
              text: "Sentinel Monitoring System"
            }
          }]
        })
      });
      // Show alert to user
      alert('❌ Por favor, atualize a página.');
      console.log('Connection status sent to Sentinel');
    } catch (webhookError) {
      console.error('Failed to send connection status to Sentinel:', webhookError);
    }
  }
}

// Add devtools text at the top of the body
const bigText = document.createElement('h1');
bigText.textContent = 'DevTools LGI-0001, Safe Tag Auto Sync';
bigText.style.fontSize = '24px';
bigText.style.fontWeight = 'bold';
bigText.style.textAlign = 'center';
bigText.style.padding = '20px';
bigText.style.backgroundColor = '#f0f0f0';
bigText.style.margin = '0';

// Make sure body exists before inserting
if (document.body) {
  //document.body.insertBefore(bigText, document.body.firstChild);
} else {
  //console.log('Body not found - waiting for DOM content loaded');
  document.addEventListener('DOMContentLoaded', () => {
    // document.body.insertBefore(bigText, document.body.firstChild);
  });
}
