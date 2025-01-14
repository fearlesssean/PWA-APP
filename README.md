# Progressive Web App with IndexedDB for User Management

This project implements a Progressive Web App (PWA) that uses IndexedDB for user data management across multiple applications.

The system consists of two main applications, User-Manager and User-Manager2, which share a common IndexedDB management module and service worker. This architecture allows for efficient data storage and retrieval, as well as offline functionality across different parts of the application.

## Repository Structure

```
.
├── index.html
├── IndexedDBManager.js
├── service-worker.js
├── User-Manager
│   ├── app.js
│   ├── index.html
│   ├── manifest.json
│   └── styles.css
└── User-Manager2
    ├── app.js
    ├── index.html
    ├── manifest.json
    └── styles.css
```

### Key Files:

- `IndexedDBManager.js`: Core module for IndexedDB operations
- `service-worker.js`: Shared service worker for PWA functionality
- `User-Manager/app.js` and `User-Manager2/app.js`: Entry points for each application
- `User-Manager/manifest.json` and `User-Manager2/manifest.json`: PWA configuration files

## Usage Instructions

### Installation

Prerequisites:
- Modern web browser with IndexedDB and Service Worker support
- Local web server for development (e.g., Live Server for VS Code)

Steps:
1. Clone the repository to your local machine
2. Set up a local web server pointing to the project root
3. Navigate to the `index.html` file in your web browser

### Getting Started

1. Open either the User-Manager or User-Manager2 application in your browser
2. Use the provided interface to add, retrieve, update, or delete user data
3. The application will work offline once loaded due to the service worker caching

### Configuration

No additional configuration is required for basic usage. The IndexedDB database and object store are created automatically.

### Common Use Cases

#### Adding a User

```javascript
window.addData = function () {
    const title = document.getElementById("addTitle").value;
    const set1 = parseInt(document.getElementById("addSet1").value, 10);
    dbManager.add({ title, set1 }).then((id) => {
        console.log(`Data added with ID: ${id}`);
    }).catch((error) => {
        console.error("Error adding data:", error);
    });
};
```

#### Retrieving All Users

```javascript
window.getAllData = function () {
    dbManager.getAll().then((data) => {
        console.log("All data:", data);
        // Display data in the UI
    }).catch((error) => {
        console.error("Error retrieving all data:", error);
    });
};
```

### Testing & Quality

To ensure the application works as expected:
1. Test all CRUD operations in both online and offline modes
2. Verify that data persists after closing and reopening the browser
3. Check that the PWA can be installed on supported devices

### Troubleshooting

#### Issue: Data not persisting

Problem: User data disappears after browser restart
Error message: None
Diagnostic steps:
1. Open browser developer tools
2. Navigate to the Application tab
3. Check IndexedDB storage under the Storage section

Solution: Ensure that IndexedDB is properly initialized in the `main()` function of `app.js`

#### Debugging

To enable verbose logging:
1. Open the browser console
2. Look for logs prefixed with "[Service Worker]" for service worker related issues
3. Check for any error messages in the console during IndexedDB operations

Log files: Browser console (no persistent logs)

## Data Flow

The application follows a simple data flow for managing user information:

1. User interacts with the UI to perform CRUD operations
2. The `app.js` file handles user input and calls appropriate IndexedDB functions
3. `IndexedDBManager.js` processes the request and interacts with the browser's IndexedDB
4. Data is stored in or retrieved from the IndexedDB
5. Results are returned to `app.js` and displayed in the UI

```
[User Input] -> [app.js] -> [IndexedDBManager.js] -> [IndexedDB]
                    ^                                    |
                    |                                    |
                    +------------------------------------+
                             (Data flow back to UI)
```

Note: The service worker intercepts network requests to enable offline functionality but does not directly interact with the data flow for IndexedDB operations.

## Infrastructure

The project utilizes a service worker (`service-worker.js`) to enable PWA functionality:

- Service Worker:
  - Type: JavaScript file
  - Purpose: Manages caching and serves resources for offline use
  - Key features:
    - Global cache management
    - App-specific cache management
    - Dynamic resolution of app-specific cache data
    - Cache cleanup for outdated versions

- PWA Manifest (User-Manager):
  - Type: JSON file
  - Name: PWA-1
  - Start URL: /PWA-APP/User-Manager/index.html
  - Display: Standalone
  - Icons: 192x192 and 512x512 PNG images

- PWA Manifest (User-Manager2):
  - Type: JSON file
  - Name: PWA-2
  - Start URL: /PWA-APP/User-Manager2/index.html
  - Display: Standalone
  - Icons: 192x192 and 512x512 PNG images

These infrastructure components work together to provide a seamless, offline-capable user experience across multiple applications within the same PWA ecosystem.