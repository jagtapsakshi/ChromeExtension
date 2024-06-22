document.addEventListener('DOMContentLoaded', () => {
    const folderInput = document.getElementById('folder');
    const noteInput = document.getElementById('note');
    const saveButton = document.getElementById('save-button');
    const folderSelect = document.getElementById('folder-select');
    const notesList = document.getElementById('notes-list');

    console.log('DOM fully loaded and parsed');

    // Load the saved folders and notes from local storage
    chrome.storage.local.get(['quickData'], function(result) {
        if (!chrome.runtime.lastError) {
            const data = result.quickData || {};
            console.log('Loaded data on startup:', data);
            renderFolders(Object.keys(data));
        }
    });

    // Function to render folders
    function renderFolders(folders) {
        folderSelect.innerHTML = '';
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.textContent = folder;
            folderSelect.appendChild(option);
        });
        renderNotes(folderSelect.value);
    }

    // Function to render notes
    function renderNotes(folderName) {
        notesList.innerHTML = '';
        chrome.storage.local.get(['quickData'], function(result) {
            const data = result.quickData || {};
            const notes = data[folderName] || [];
            notes.forEach((note, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = note;

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete Note';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', () => {
                    deleteNote(folderName, index);
                });

                listItem.appendChild(deleteButton);
                notesList.appendChild(listItem);
            });
        });
    }

    // Save the folder and note to local storage
    saveButton.addEventListener('click', () => {
        const folderName = folderInput.value.trim();
        const newNote = noteInput.value.trim();
        if (folderName !== '' && newNote !== '') {
            chrome.storage.local.get(['quickData'], function(result) {
                const data = result.quickData || {};
                console.log("Data before saving:", JSON.stringify(data)); // Log data before saving
                if (!data[folderName]) {
                    data[folderName] = [];
                }
                if (!data[folderName].includes(newNote)) { // Check if note already exists in folder
                    data[folderName].push(newNote);
                    chrome.storage.local.set({ quickData: data }, function() {
                        if (!chrome.runtime.lastError) {
                            console.log("Data after saving:", JSON.stringify(data)); // Log data after saving
                            renderFolders(Object.keys(data));
                            renderNotes(folderName);
                            folderInput.value = '';
                            noteInput.value = ''; // Clear note input field
                        }
                    });
                } else {
                    alert("Note already exists in this folder!");
                }
            });
        }
    });

    // Function to delete a note
    function deleteNote(folderName, index) {
        chrome.storage.local.get(['quickData'], function(result) {
            const data = result.quickData || {};
            const notes = data[folderName] || [];
            notes.splice(index, 1);
            data[folderName] = notes;
            chrome.storage.local.set({ quickData: data }, function() {
                if (!chrome.runtime.lastError) {
                    renderNotes(folderName);
                    if (notes.length === 0) {
                        deleteFolder(folderName);
                    }
                }
            });
        });
    }

    // Function to delete a folder
    function deleteFolder(folderName) {
        chrome.storage.local.get(['quickData'], function(result) {
            const data = result.quickData || {};
            delete data[folderName];
            chrome.storage.local.set({ quickData: data }, function() {
                if (!chrome.runtime.lastError) {
                    renderFolders(Object.keys(data));
                    if (Object.keys(data).length === 0) {
                        notesList.innerHTML = ''; // Clear notes list if no folders left
                    } else {
                        renderNotes(folderSelect.value);
                    }
                }
            });
        });
    }

    // Event listener for folder selection
    folderSelect.addEventListener('change', () => {
        renderNotes(folderSelect.value);
    });
});
