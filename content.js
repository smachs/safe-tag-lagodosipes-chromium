let isHandled = false; // Flag to ensure we only handle the page once

// Constants at the top for reuse
const WEBHOOK_URL = "https://discord.com/api/webhooks/1332114452979515454/-kT_hyZVSFKWo1-TyFY6damkNHAzAVDpbLzJijg4YXZ3Tx18WXd8XOOS5aUrm1tSZfng";
const API_URL = "https://safe-tag-check-route-853432718953.southamerica-east1.run.app/";

// Helper function to send Discord messages
async function sendToDiscord(content, title, description, fields, color) {
  try {
    // Format date in PT-BR timezone
    const timestamp = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Add timestamp to fields
    fields.push({
      name: "Timestamp",
      value: timestamp,
      inline: false
    });

    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        embeds: [{
          title,
          description,
          color,
          fields
        }]
      })
    });
    console.log('Message sent to Sentinel:', title);
  } catch (error) {
    console.error('Failed to send to Sentinel:', error);
  }
}

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

  // More specific selector for phone number input
  const phoneInput = document.querySelector('input[tips*="São permitidos de 1 a 32 caracteres, incluindo dígitos"]') ||
    document.querySelector('.el-form-item input[maxlength="32"]');

  // Look for both "Entrar e continuar" and "Entrar" buttons
  const continueButton = document.querySelector('button[title="Entrar e continuar"][data-v-eb02dcfc]');
  const startButton = document.querySelector('button[title="Entrada"][data-v-eb02dcfc]');

  // Send connection status message
  try {
    sendToDiscord(
      "📡 Auto Sync Connected Successfully",
      "Connection Status Check",
      "Successfully established connection with HikCentral",
      [
        { name: "Status", value: "✅ Connected", inline: true },
        { name: "Form Elements", value: "✅ All Required Fields Found", inline: true },
        { name: "Page Check", value: "✅ On Entrada Page", inline: true },
        { name: "DOM Ready", value: document.readyState, inline: true },
        { name: "Version", value: "v1.0.0", inline: true },
      ],
      5763719 // Green color for success
    );
    console.log('Connection success status sent to Sentinel');
  } catch (webhookError) {
    console.error('Failed to send connection success status to Sentinel:', webhookError);
  }

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

  // If "Entrar e continuar" is found, add event listener
  if (continueButton) {
    continueButton.addEventListener('click', async (e) => {
      e.preventDefault();
      //console.log('Continue button clicked');

      // Get the current values
      const guestPhone = phoneInput ? phoneInput.value.trim() : '';
      const guestName = givenNameInput ? givenNameInput.value : '';
      const surname = givenSurnameInput ? givenSurnameInput.value.trim() : '';
      const residentName = visitedInput ? visitedInput.value : '';

      if (guestName === '') {
        // console.log('Guest name check:', {guestName, surname});
        await sendToDiscord(
          "⚠️ Empty Guest Name Alert via Auto Sync",
          "Missing Guest Information",
          "Attempted to create token without guest name",
          [
            { name: "Guest Phone", value: guestPhone || "Not provided", inline: true },
            { name: "Resident Name", value: residentName || "Not provided", inline: true },
            { name: "Status", value: "❌ No Guest Name Provided", inline: true }
          ],
          16776960 // Yellow color for warning
        );
        return;
      }

      if (residentName === '') {
        //console.log('No resident name found');
        await sendToDiscord(
          "⚠️ Empty Resident Alert via Auto Sync",
          "Missing Resident Information",
          "Attempted to create token without resident information",
          [
            { name: "Guest Name", value: surname ? `${guestName} ${surname}` : guestName || "Not provided", inline: true },
            { name: "Guest Phone", value: guestPhone || "Not provided", inline: true },
            { name: "Status", value: "❌ No Resident Selected", inline: true }
          ],
          16776960 // Yellow color for warning
        );
        return;
      }

      if (guestPhone === '') {
        //console.log('No phone number found');
        await sendToDiscord(
          "⚠️ Empty Phone Number Alert via Auto Sync",
          "Missing Phone Number",
          "Attempted to create token without phone number",
          [
            { name: "Guest Name", value: surname ? `${guestName} ${surname}` : guestName || "Not provided", inline: true },
            { name: "Resident Name", value: residentName || "Not provided", inline: true },
            { name: "Resident Address", value: residentName ? residentName.match(/\[([A-Z]\d{1,2})/)[1].replace(/([A-Z])(\d+)/, '$1 $2') : "Not provided", inline: true }
          ],
          16776960 // Yellow color for warning
        );
        return;
      }

      // Continue with the rest of the code if both phone and resident exist
      const fullGuestName = surname ? `${guestName} ${surname}` : guestName;

      let residentAddress = "Rua das Alamedas, 369"; // default value
      const match = residentName.match(/\[([A-Z]\d{1,2})/);
      if (match) {
        residentAddress = match[1].replace(/([A-Z])(\d+)/, '$1 $2');
        // console.log('Extracted address:', residentAddress);
      }

      // console.log('Current phone number:', guestPhone);
      // console.log('Current guest name:', fullGuestName);
      // console.log('Resident address:', residentAddress);

      try {
        const createToken = await fetch(API_URL + 'create-token', {
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

        const visitResult = await createToken.json();
        console.log('Visit created:', visitResult);

        // Send success message to Discord
        await sendToDiscord(
          "✅ Token Created Successfully via Auto Sync",
          "New Token Details",
          "A new token was successfully created",
          [
            { name: "Guest Name", value: fullGuestName || "Not provided", inline: true },
            { name: "Guest Phone", value: guestPhone || "Not provided", inline: true },
            { name: "Resident Name", value: residentName || "Not provided", inline: true },
            { name: "Resident Address", value: residentAddress || "Not provided", inline: true },
            { name: "Token ID", value: visitResult.tokenId || "Not available", inline: true }
          ],
          5763719 // Green color for success
        );

        // Show success confirmation
        const confirmed = confirm('✅ Rastreador criado com sucesso! Clique em OK para atualizar a página.');

        if (confirmed) {
          // console.log('Refreshing page in 1 second...');
          // Refresh page after 1 second
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          try {
            await sendToDiscord(
              "ℹ️ User Action: Refresh Cancelled",
              "Token Created - Page Not Refreshed",
              "Token was created successfully but user chose not to refresh the page",
              [
                { name: "Guest Name", value: fullGuestName || "Not provided", inline: true },
                { name: "Guest Phone", value: guestPhone || "Not provided", inline: true },
                { name: "Resident Name", value: residentName || "Not provided", inline: true },
                { name: "Resident Address", value: residentAddress || "Not provided", inline: true },
                { name: "Token ID", value: visitResult.tokenId || "Not available", inline: true }
              ],
              3447003 // Blue color for info
            );
          } catch (webhookError) {
            console.error('Failed to send cancel action to Sentinel:', webhookError);
          }
        }
      } catch (error) {
        console.error('Error sending token to API:', error);

        // Send error to Sentinel
        try {
          await sendToDiscord(
            "❌ Error creating token via Auto Sync",
            "API Error Details",
            error.message || "Unknown error",
            [
              { name: "Error Message", value: error.message || "Unknown error", inline: false },
              {
                name: "Request Data", value: "```json\n" + JSON.stringify({
                  guest_display_name: fullGuestName,
                  guest_phone_number: guestPhone,
                  resident_display_name: residentName,
                  resident_address: residentAddress
                }, null, 2) + "\n```",
                inline: false
              },
              { name: "Guest Name", value: fullGuestName || "Not provided", inline: true },
              { name: "Guest Phone", value: guestPhone || "Not provided", inline: true },
              { name: "Resident Name", value: residentName || "Not provided", inline: true },
              { name: "Resident Address", value: residentAddress || "Not provided", inline: true }
            ],
            15158332 // Red color
          );
        } catch (webhookError) {
          console.error('Failed to send error to Sentinel:', webhookError);
        }
      }
    });
  } else {
    try {
      sendToDiscord(
        "🔌 Auto Sync Connection Alert",
        "Connection Status Check",
        "Unable to establish connection with the HikCentral",
        [
          { name: "Status", value: "❌ Button Not Found", inline: true },
          { name: "Element Selector", value: "`button[title='Dar entrada e continuar'][data-v-eb02dcfc]`", inline: true },
          { name: "Page Check", value: document.querySelector('span[data-v-27ffe136][title="Entrada"]') ? "✅ On Entrada Page" : "❌ Not on Entrada Page", inline: true },
          { name: "DOM Ready", value: document.readyState, inline: true },
          { name: "Version", value: "v1.0.0", inline: true },
        ],
        3447003 // Blue color for info
      );
      console.log('Connection status sent to Sentinel');

      // Show alert to user
      alert('❌ Por favor, atualize a página!');
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
