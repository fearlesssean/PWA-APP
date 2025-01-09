let IndexedDBManager; // Declare IndexedDBManager globally
let dbManager; // Declare dbManager globally

async function main() {
    try {
        const module = await import('/PWA-APP/assets/js/IndexedDBManager.js'); // Dynamically import the module
        IndexedDBManager = module.IndexedDBManager; // Assign the exported class to a variable

        // Initialize the database
        dbManager = new IndexedDBManager("MyDatabase", "MyStore");
        await dbManager.init();
        console.log("Database initialized");
    } catch (error) {
        console.error("Error initializing the database:", error);
    }
}

// Expose functions to the global scope
window.addData = function () {
    const name = document.getElementById("addName").value;
    const age = parseInt(document.getElementById("addAge").value, 10);
    dbManager.add({ name, age }).then((id) => {
        console.log(`Data added with ID: ${id}`);
    }).catch((error) => {
        console.error("Error adding data:", error);
    });
};

window.getData = function () {
    const id = parseInt(document.getElementById("getId").value, 10);
    dbManager.get(id).then((data) => {
        console.log("Retrieved data:", data);
    }).catch((error) => {
        console.error("Error retrieving data:", error);
    });
};

window.updateData = function () {
    const id = parseInt(document.getElementById("updateId").value, 10);
    const name = document.getElementById("updateName").value;
    const age = parseInt(document.getElementById("updateAge").value, 10);
    dbManager.update({ id, name, age }).then(() => {
        console.log(`Data with ID ${id} updated`);
    }).catch((error) => {
        console.error("Error updating data:", error);
    });
};

window.deleteData = function () {
    const id = parseInt(document.getElementById("deleteId").value, 10);
    dbManager.delete(id).then(() => {
        console.log(`Data with ID ${id} deleted`);
    }).catch((error) => {
        console.error("Error deleting data:", error);
    });
};

window.getAllData = function () {
    dbManager.getAll().then((data) => {
        console.log("All data:", data);
        const dataList = document.getElementById("dataList");

        // Clear existing content
        dataList.innerHTML = '';

        // Create and append user elements
        data.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.classList.add('user-item'); // Optional: for styling
            userDiv.innerHTML = `
                <hr>
                <h3>${user.name}</h3>
                <p>Age: ${user.age}</p>
                <p>ID: ${user.id}</p>
            `;
            dataList.appendChild(userDiv);
        });
    }).catch((error) => {
        console.error("Error retrieving all data:", error);
    });
};

// Install button script
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    document.getElementById('install-button').style.display = 'block';
});

document.getElementById('install-button').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
    }
});

window.addEventListener('appinstalled', () => {
    console.log('PWA-APP installed');
    document.getElementById('install-button').style.display = 'none';
});

//Register the service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/PWA-APP/sw.js')
        .then(() => console.log('Service Worker Registered'))
        .catch((err) => console.error('Service Worker Registration Failed:', err));
}

// Run the main function
main();
