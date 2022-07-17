//variable to hold indexedDB connection
let db
//establish connection to indexedDB database 'budget_tracker', version 1
const request = indexedDB.open("budget_tracker", 1)

// this event emits when the database version changes, nonexistent to v1, v1 to v2 etc
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    //create and object store (table) called new_transaction with an auto incrementing primary key
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

// upon a successful database creation or connection
request.onsuccess = function(event) {
    // set global db variable to reference database connection
    db = event.target.result

    //check if app is online, if so run uploadTransactions() to send local db data to api
    if (navigator.online) {
        uploadTransactions()
    }
};

request.onerror = function(event) {
    //log database connection or creation error
    console.log("Unable to create or connect to loca database:", event.target.errorCode);
}

// function to execute if no internet connection on transaction upload
function saveRecord(record) {
    // open a new transaction with db with read/write permissions
    const transaction = db.transaction(["new_transaction"], "readwrite");
    
    //access the object store for new_transaction
    const transactionObjectStore = transaction.objectStore("new_transaction")

    //add record to store with add method
    transactionObjectStore.add(record);
}


function uploadTransactions() {
    // open a transaction on db
    const transaction = db.transaction(["new_transaction"], "readwrite");
    //access new_transaction object store
    const transactionObjectStore = transaction.objectStore("new_transaction");
    //get all records from store and set to getAll
    const getAll = transactionObjectStore.getAll();

    // run this function on successful .getAll()
    getAll.onsuccess = function () {
        // if there was data in indexDb's store, send it to api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open another transaction
                const transaction = db.transaction(["new_transaction"], "readwrite");
                //access new_transaction object store
                const transactionObjectStore = transaction.objectStore("new_transaction");
                //clear all items in new_transaction store
                transactionObjectStore.clear();

                console.log("all offline transactions successfully submitted!");
            })
            .catch(err => {
                console.log(err);
            })
        }
    }
}

window.addEventListener('online', uploadTransactions)

