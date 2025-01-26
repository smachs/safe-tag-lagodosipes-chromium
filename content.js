// Constants and globals at the top
let checkTimer = null;
let isProcessing = false;

let elements = {
  givenNameInput: null,
  givenSurnameInput: null,
  visitedInput: null,
  phoneInput: null,
  continueButton: null,
  startButton: null
};

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

    console.log('Sending Discord webhook:', { content, title, description, fields });

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
    console.log('Discord webhook sent successfully');
  } catch (error) {
    console.error('Failed to send to Discord:', error);
  }
}

function checkElements() {
  elements = {
    givenNameInput: document.querySelector('.given-name-item input.el-input__inner'),
    givenSurnameInput: document.querySelector('.search_hcp_visitor-panel .el-input__inner'),
    visitedInput: document.querySelector('div[data-v-de849942][data-v-e10c82a2].search-person-panel input.el-input__inner[placeholder="Pesquisar"]'),
    continueButton: document.querySelector('button[title="Dar entrada e continuar"][data-v-eb02dcfc]'),
    startButton: document.querySelector('button[title="Entrada"][data-v-eb02dcfc]')
  };

  // Find phone input using emails div as reference
  const emailsDiv = document.querySelector('div[data-v-e10c82a2].el-form-item.emails');
  if (emailsDiv && emailsDiv.nextElementSibling) {
    elements.phoneInput = emailsDiv.nextElementSibling.querySelector('input.el-input__inner');
  }

  // Log element states
  console.log('Elements found:', Object.entries(elements)
    .map(([key, value]) => `${key}: ${value ? '✅' : '❌'}`)
    .join(', '));

  // If continue button is found and click handler not yet added
  if (elements.continueButton && !elements.continueButton.hasAttribute('data-handler-added')) {
    console.log('Adding click handler to continue button');

    elements.continueButton.setAttribute('data-handler-added', 'true');

    elements.continueButton.addEventListener('click', async (e) => {
      e.preventDefault();

      if (isProcessing) {
        console.log('Token creation already in progress');
        return;
      }

      isProcessing = true;
      stopChecking();
      console.log('Timer stopped on button click');

      // Get the current values
      const guestPhone = elements.phoneInput ? elements.phoneInput.value : '';
      const guestName = elements.givenNameInput ? elements.givenNameInput.value : '';
      const surname = elements.givenSurnameInput ? elements.givenSurnameInput.value.trim() : '';
      const residentName = elements.visitedInput ? elements.visitedInput.value : '';

      try {
        console.log('Form values:', { guestPhone, guestName, surname, residentName });

        if (guestName === '') {
          console.log('Empty guest name detected, sending webhook');
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
        }

        if (residentName === '') {
          console.log('Empty resident name detected, sending webhook');
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
        }

        if (guestPhone === '') {
          console.log('Empty phone detected, sending webhook');
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
        }

        // Continue with the rest of the code if both phone and resident exist
        const fullGuestName = surname ? `${guestName} ${surname}` : guestName;

        let residentAddress = ""; // default value
        const match = residentName.match(/\[([A-Z]\d{1,2})/);
        if (match) {
          residentAddress = match[1].replace(/([A-Z])(\d+)/, '$1 $2');
          // console.log('Extracted address:', residentAddress);
        }

        // console.log('Current phone number:', guestPhone);
        // console.log('Current guest name:', fullGuestName);
        // console.log('Resident address:', residentAddress);

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

        if (createToken.ok) {
          const visitResult = await createToken.json();
          console.log('Visit created:', visitResult);

          // Clear form values
          if (elements.phoneInput) elements.phoneInput.value = '';
          if (elements.givenNameInput) elements.givenNameInput.value = '';
          if (elements.givenSurnameInput) elements.givenSurnameInput.value = '';
          if (elements.visitedInput) elements.visitedInput.value = '';

          // alert('✅ Token created successfully!');
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

          // Reset processing state
          isProcessing = false;

          // Restart timer after success
          startChecking();
          console.log('Timer restarted after success');
        } else {
          throw new Error(`HTTP error! status: ${createToken.status}`);
        }
      } catch (error) {
        // Continue with the rest of the code if both phone and resident exist
        const fullName = surname ? `${guestName} ${surname}` : guestName;
        let address = ""; // default value
        const match = residentName.match(/\[([A-Z]\d{1,2})/);
        if (match) {
          address = match[1].replace(/([A-Z])(\d+)/, '$1 $2');
          // console.log('Extracted address:', address);
        }
        console.error('Error:', error);

        // Error webhook
        await sendToDiscord(
          "❌ Error creating token via Auto Sync",
          "API Error Details",
          error.message || "Unknown error",
          [
            { name: "Error Message", value: error.message || "Unknown error", inline: false },
            {
              name: "Request Data", value: "```json\n" + JSON.stringify({
                guest_display_name: fullName,
                guest_phone_number: guestPhone,
                resident_display_name: residentName,
                resident_address: address
              }, null, 2) + "\n```",
              inline: false
            },
            { name: "Guest Name", value: fullName || "Not provided", inline: true },
            { name: "Guest Phone", value: guestPhone || "Not provided", inline: true },
            { name: "Resident Name", value: residentName || "Not provided", inline: true },
            { name: "Resident Address", value: address || "Not provided", inline: true }
          ],
          15158332 // Red color
        );

        isProcessing = false;
        startChecking();
        console.log('Timer restarted after error');
      }
    });
  }
}

function startChecking() {
  if (checkTimer) {
    clearInterval(checkTimer);
  }

  checkTimer = setInterval(checkElements, 2000);
  console.log('Element check timer started');
}

function stopChecking() {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
    console.log('Element check timer stopped');
  }
}

// Start initial check
startChecking();
