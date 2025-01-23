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
  const continueButton = document.querySelector('button[title="Entrar e continuar"][data-v-eb02dcfc]');
  const startButton = document.querySelector('button[title="Entrada"][data-v-eb02dcfc]');

  if (continueButton) {
    continueButton.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Continue button clicked');
      
      // Get the current values
      const guestPhone = phoneInput ? phoneInput.value : '';
      const guestName = givenNameInput ? givenNameInput.value : ''; 
      const surname = givenSurnameInput ? givenSurnameInput.value.trim() : '';
      const residentName = visitedInput ? visitedInput.value : '';
      
      // Combine name and surname if surname exists
      const fullGuestName = surname ? `${guestName} ${surname}` : guestName;
      
      let residentAddress = "Rua das Flores, 123"; // default value
      const match = residentName.match(/\[([A-Z]\d{1,2})/);
      if (match) {
        residentAddress = match[1].replace(/([A-Z])(\d+)/, '$1 $2');
        console.log('Extracted address:', residentAddress);
      }
      
      console.log('Current phone number:', guestPhone);
      console.log('Current guest name:', fullGuestName);
      console.log('Resident address:', residentAddress);

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

      } catch (error) {
        console.error('Error fetching API data:', error);
        alert('Error fetching data from API. Check console for details.');
      }
    });
  }

  if (startButton) {
    startButton.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Start button clicked');
      
      const guestPhone = phoneInput ? phoneInput.value : '';
      const guestName = givenNameInput ? givenNameInput.value : ''; 
      const surname = givenSurnameInput ? givenSurnameInput.value.trim() : '';
      const residentName = visitedInput ? visitedInput.value : '';
      
      const fullGuestName = surname ? `${guestName} ${surname}` : guestName;
      
      let residentAddress = "Rua das Flores, 123"; // default value
      const match = residentName.match(/\[([A-Z]\d{1,2})/);
      if (match) {
        residentAddress = match[1].replace(/([A-Z])(\d+)/, '$1 $2');
        console.log('Extracted address:', residentAddress);
      }
      
      console.log('Current phone number:', guestPhone);
      console.log('Current guest name:', fullGuestName);
      console.log('Resident address:', residentAddress);

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

      } catch (error) {
        console.error('Error fetching API data:', error);
        alert('Error fetching data from API. Check console for details.');
      }
    });
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
