# WhatsApp Integration

This update adds **WhatsApp Web** integration directly into the Control Panel.

## Features

- **QR Code Login**: Scan the QR code displayed in the panel to connect your WhatsApp account.
- **Status Monitoring**: Real-time connection status (Connected, Disconnected, QR Ready).
- **Session Persistence**: Your session is saved locally, so you don't need to scan the QR code every time you restart the server.

## How to Use

1. **Restart the Server**:

    ```bash
    node server.js
    ```

2. **Open the Panel**: Go to [http://localhost:3000/panel](http://localhost:3000/panel).
3. **Go to WhatsApp Tab**: Click "WhatsApp" in the sidebar.
4. **Scan QR Code**:
    - Open WhatsApp on your phone.
    - Go to **Settings** > **Linked Devices** > **Link a Device**.
    - Scan the QR code shown on the screen.
5. **Connected**: Once connected, you will see a green success message.

## Troubleshooting

- **Stuck on "Connecting..."**: If the spinner spins for too long, try refreshing the page or restarting the server.
- **QR Code Not Loading**: Ensure the server is running and `whatsapp-web.js` has initialized (check the server console for logs).
- **Logout**: Use the "Logout / Reset" button to clear the session and generate a new QR code.

## Technical Details

- Uses `whatsapp-web.js` running via Puppeteer (headless).
- Session data is stored in the `.wwebjs_auth` folder.
