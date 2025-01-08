let IndexedDBManager; // Declare IndexedDBManager globally
let dbManager; // Declare dbManager globally

async function main() {
    try {
        const module = await import('../IndexedDBManager.js'); // Dynamically import the module
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
    const title = document.getElementById("addTitle").value;
    const set1 = parseInt(document.getElementById("addSet1").value, 10);
    dbManager.add({ title, set1 }).then((id) => {
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
    const title = document.getElementById("updateTitle").value;
    const set1 = parseInt(document.getElementById("updateSet1").value, 10);
    dbManager.update({ id, title, set1 }).then(() => {
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
                <h3>${user.title}</h3>
                <p>Set 1: ${user.set1}</p>
                <p>ID: ${user.id}</p>
            `;
            dataList.appendChild(userDiv);
        });
    }).catch((error) => {
        console.error("Error retrieving all data:", error);
    });
};

//Register the service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../service-worker.js', { scope: '/User-Manager/' })
        .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
}

// Run the main function
main();
