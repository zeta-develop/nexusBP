### Licenses (`/licenses`)

All endpoints under `/api/licenses` require an `x-auth-token` header with a valid JWT for authentication, **except for the public `/validate` endpoint.**

*   `POST /licenses`: Create a new license.
    *   Body: `{ userId: 1 (optional, defaults to self if not admin), status: ACTIVE (optional), expiresAt: YYYY-MM-DDTHH:mm:ss.sssZ (optional), productId: 1 (optional) }`
    *   Returns: License object. The generated `licenseKey` will have an inv- prefix (e.g., `inv-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
*   `GET /licenses`: List licenses (all for admin, own for client).
*   `GET /licenses/:id`: Get a specific license.
*   `PUT /licenses/:id`: Update a license (admin only).
*   `DELETE /licenses/:id`: Delete a license (admin only).
*   `POST /licenses/validate`: Validate a license key. **(Public Endpoint - No `x-auth-token` required)**
    *   Body: `{ licenseKey: inv-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx }`
### Subscriptions (`/subscriptions` & `/users`) - Requires `x-auth-token`

*   `POST /subscriptions`: Create a new subscription.
*   `GET /subscriptions/mine`: Get logged-in user's subscriptions.
*   `GET /subscriptions`: Get all subscriptions (admin only, non-admin gets their own).
*   `GET /users/:userId/subscriptions`: Get subscriptions for a specific user (admin or self).
*   `PUT /subscriptions/:subscriptionId`: Update a subscription (admin or owner).

### Payments (`/payments`)

*   `POST /payments/initiate`: Placeholder for initiating a payment (requires auth).
*   `POST /payments/webhook`: Placeholder for receiving payment provider webhooks.

---

This README provides an overview of the refactored application using SQLite and Prisma.


## Frontend Application (React + Vite)

A React-based frontend application is located in the `frontend/` directory to interact with the License Management System API.

### Frontend Prerequisites

*   Node.js and npm (same as the backend).

### Frontend Setup and Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Frontend Development Server

1.  **Ensure the backend API server is running.** (Typically on `http://localhost:3000`, as per backend `npm start`).

2.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

3.  **Start the Vite development server:**
    ```bash
    npm run dev
    ```
    This will usually start the frontend on `http://localhost:5173` (or another port if 5173 is busy) and open it in your browser.

    **Note on API Proxy:** The frontend is configured to make API calls to relative paths like `/api/auth/login`. For this to work during development, the Vite development server needs to proxy these requests to your running backend API. You'll need to add a proxy configuration to `frontend/vite.config.js`. If it's not already there, add a `server` section like this:

    ```javascript
    // frontend/vite.config.js
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      server: { // Add this server configuration
        proxy: {
          '/api': {
            target: 'http://localhost:3000', // Your backend API URL
            changeOrigin: true,
            // secure: false, // Uncomment if your backend is HTTPS and has self-signed cert
            // rewrite: (path) => path.replace(/^\/api/, ''), // If your backend doesn't expect /api prefix
          }
        }
      }
    });
    ```
    Make sure to restart the Vite development server after adding or changing this configuration.

### Frontend Structure

*   `frontend/src/`: Main application source code.
    *   `components/`: Reusable React components.
    *   `contexts/`: React context providers (e.g., `AuthContext`).
    *   `pages/`: Page-level components.
    *   `services/`: Modules for API interactions (`AuthService`, `LicenseService`, etc.) and the central `api.js` for Axios instance.
    *   `App.jsx`: Main application component with routing.
    *   `main.jsx`: Entry point for the React application.
    *   `index.css`: Global styles.
*   `frontend/vite.config.js`: Vite configuration file.
*   `frontend/package.json`: Frontend project metadata and dependencies.
