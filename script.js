// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- API Configuration ---
    const API_URL = 'http://localhost:5000/api';

    // --- Element Selections ---
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    const tablesContainer = document.getElementById('tables-container');
    const totalCountDisplay = document.getElementById('total-count-display');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const overlay = document.getElementById('overlay');
    const sidebarLinks = document.getElementById('sidebar-links');
    const bgToggleBtn = document.getElementById('bg-toggle-btn');
    const downloadContainer = document.getElementById('download-container');
    const downloadTxtBtn = document.getElementById('download-txt-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadJsonBtn = document.getElementById('download-json-btn');
    const sidebarUploadContainer = document.getElementById('sidebar-upload-container');
    const mainContent = document.getElementById('main-content');
    const createContainer = document.getElementById('create-container');
    const newCategoryInput = document.getElementById('new-category-input');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const addCategorySidebarBtn = document.getElementById('add-category-sidebar-btn');
    const notificationContainer = document.getElementById('notification-container');
    const searchInput = document.getElementById('search-input');
    const detailsModal = document.getElementById('details-modal');
    const modalContent = document.getElementById('modal-content');

    // Set the worker source for PDF.js
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
    }

    // --- Notification System ---
    function showNotification(message, type = 'info') {
        if (!notificationContainer) return;

        const bgColor = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            error: 'bg-red-500',
            warn: 'bg-yellow-500'
        }[type];

        const notification = document.createElement('div');
        notification.className = `notification ${bgColor} text-white p-4 rounded-lg shadow-lg mb-2`;
        notification.textContent = message;

        notificationContainer.appendChild(notification);

        // Trigger fade out and remove after a delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, 3000); // Notification visible for 3 seconds
    }

    // --- Global Data Store ---
    let categoriesData = {};

    // --- UI Interaction Logic ---

    // Background Image Toggle
    const backgroundImages = ['Background/bg1.jpeg', 'Background/bg2.jpeg', 'Background/bg3.jpeg', 'Background/bg4.jpeg', 'Background/bg5.jpeg', 'Background/bg6.jpeg'];
    let currentBgIndex = 0;
    document.body.style.backgroundImage = `url('${backgroundImages[0]}')`; // Set initial background

    function toggleBackground() {
        currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
        document.body.style.backgroundImage = `url('${backgroundImages[currentBgIndex]}')`;
    }

    // Sidebar Toggle
    function toggleSidebar() {
        const isOpen = !sidebar.classList.contains('-translate-x-full');
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
        if (isOpen) {
            mainContent.classList.remove('ml-64');
        } else {
            mainContent.classList.add('ml-64');
        }
    }

    // Modal Logic
    function openDetailsModal() {
        detailsModal.classList.remove('hidden');
    }

    function closeDetailsModal() {
        detailsModal.classList.add('hidden');
        modalContent.innerHTML = ''; // Clear content to prevent old data flashing
    }

    async function fetchAndDisplayDetails(entry) {
        openDetailsModal();
        modalContent.innerHTML = `<p class="text-white text-center text-lg">Fetching details for ${entry.name}...</p>`;

        try {
            const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(entry.name)}&limit=1`);
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);

            const data = await response.json();
            const manga = data.data[0];

            if (!manga) {
                modalContent.innerHTML = `<p class="text-red-400 text-center">Could not find detailed information for "${entry.name}".</p>`;
                return;
            }

            const genres = manga.genres.map(g => `<span class="bg-red-600 text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${g.name}</span>`).join(' ');

            modalContent.innerHTML = `
                <button id="modal-close-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <div class="flex flex-col md:flex-row gap-6">
                    <div class="flex-shrink-0">
                        <img src="${manga.images.jpg.large_image_url}" alt="${manga.title}" class="w-48 h-auto object-cover rounded-md mx-auto">
                    </div>
                    <div class="flex-grow">
                        <h2 class="text-3xl font-bold text-white mb-2">${manga.title}</h2>
                        <p class="text-lg text-gray-300 mb-4">${manga.title_japanese || ''}</p>
                        <div class="flex items-center space-x-4 mb-4 text-yellow-400">
                            <span>⭐ ${manga.score || 'N/A'}</span>
                            <span>#${manga.rank || 'N/A'}</span>
                            <span class="px-2 py-1 bg-gray-700 text-white rounded-md text-sm">${manga.status || 'Unknown'}</span>
                        </div>
                        <div class="mb-4">
                            ${genres}
                        </div>
                        <p class="text-gray-400 text-sm max-h-48 overflow-y-auto pr-2">${manga.synopsis || 'No synopsis available.'}</p>
                    </div>
                </div>
            `;
            document.getElementById('modal-close-btn').addEventListener('click', closeDetailsModal);

        } catch (error) {
            console.error("Failed to fetch details:", error);
            modalContent.innerHTML = `<p class="text-red-400 text-center">Error fetching details. Please check the console.</p>`;
        }
    }

    // --- Event Listeners ---
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    overlay.addEventListener('click', toggleSidebar);

    sidebarLinks.addEventListener('click', (e) => {
        const target = e.target;

        // Handle category reordering from sidebar
        if (target.classList.contains('sidebar-move-up-btn') || target.classList.contains('sidebar-move-down-btn')) {
            e.stopPropagation(); // Prevent the link click
            const category = target.dataset.category;
            const direction = target.classList.contains('sidebar-move-up-btn') ? -1 : 1;
            const categoryKeys = Object.keys(categoriesData);
            const currentIndex = categoryKeys.indexOf(category);
            const newIndex = currentIndex + direction;

            if (newIndex >= 0 && newIndex < categoryKeys.length) {
                // Swap the keys in the array
                [categoryKeys[currentIndex], categoryKeys[newIndex]] = [categoryKeys[newIndex], categoryKeys[currentIndex]];
                
                // Rebuild the categoriesData object to reflect the new order
                const newCategoriesData = {};
                categoryKeys.forEach(key => {
                    newCategoriesData[key] = categoriesData[key];
                });
                categoriesData = newCategoriesData;

                // Re-render everything to show the new order
                renderAllTables();
                updateSidebarLinks();
            }
            return;
        }

        if (target.tagName === 'A' && e.target.hash) {
            e.preventDefault();
            const targetElement = document.querySelector(e.target.hash);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            toggleSidebar();
        }
    });

    bgToggleBtn.addEventListener('click', toggleBackground);

    addCategoryBtn.addEventListener('click', () => {
        const categoryName = newCategoryInput.value.trim();
        if (categoryName && !categoriesData[categoryName]) {
            categoriesData[categoryName] = [];
            renderAllTables(); // Re-render to show the new empty table
            updateSidebarLinks();
            newCategoryInput.value = ''; // Clear input
            showNotification(`Category '${categoryName}' created successfully.`, 'success');
            // Scroll to the new table
            const newTableId = `table-container-${categoryName.replace(/\s+/g, ' ')}`;
            document.getElementById(newTableId)?.scrollIntoView({ behavior: 'smooth' });
        } else if (categoriesData[categoryName]) {
            showNotification('Category already exists.', 'error');
        } 
    });

    addCategorySidebarBtn.addEventListener('click', () => {
        const isHidden = createContainer.classList.contains('hidden');
        if (isHidden) {
            createContainer.classList.remove('hidden');
            createContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newCategoryInput.focus();
        } else {
            createContainer.classList.add('hidden');
        }
    });

    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            closeDetailsModal();
        }
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const allTableContainers = document.querySelectorAll('.table-container-glass');

        allTableContainers.forEach(container => {
            const rows = container.querySelectorAll('tbody tr');
            let categoryVisible = false;

            rows.forEach(row => {
                const nameCell = row.querySelector('td[data-field="name"]');
                if (nameCell) {
                    const name = nameCell.textContent.toLowerCase();
                    if (name.includes(searchTerm)) {
                        row.style.display = '';
                        categoryVisible = true;
                    } else {
                        row.style.display = 'none';
                    }
                }
            });

            // Hide the entire category container if no rows match
            if (categoryVisible) {
                container.style.display = '';
            } else {
                container.style.display = 'none';
            }
        });
    });

    // --- File Processing Logic ---
    function handleFile(file) {
        if (!file) return;

        const fileType = file.type;
        if (fileType !== 'text/plain' && fileType !== 'application/pdf' && fileType !== 'application/json') {
            showNotification('Invalid file type. Please upload .txt, .pdf, or .json.', 'error');
            return;
        }

        const reader = new FileReader();

        if (fileType === 'text/plain') {
            reader.onload = (e) => processData(e.target.result);
            reader.readAsText(file);
        } else if (fileType === 'application/pdf') {
            reader.onload = (e) => {
                const typedarray = new Uint8Array(e.target.result);
                pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                    const pagePromises = Array.from({ length: pdf.numPages }, (_, i) =>
                        pdf.getPage(i + 1).then(page =>
                            page.getTextContent().then(textContent => {
                                // Sort text items by their vertical position, then horizontal.
                                // This helps to reconstruct the text in the correct reading order.
                                const items = textContent.items.slice().sort((a, b) => {
                                    if (a.transform[5] < b.transform[5]) return 1;
                                    if (a.transform[5] > b.transform[5]) return -1;
                                    if (a.transform[4] < b.transform[4]) return -1;
                                    if (a.transform[4] > b.transform[4]) return 1;
                                    return 0;
                                });

                                let lastY = -1;
                                let pageText = '';
                                items.forEach(item => {
                                    // A significant change in the Y-coordinate indicates a new line.
                                    if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                                        pageText += '\n';
                                    }
                                    pageText += item.str;
                                    lastY = item.transform[5];
                                });
                                return pageText;
                            })
                        )
                    );
                    Promise.all(pagePromises).then(pageTexts => {
                        processData(pageTexts.join('\n'));
                    });
                }).catch(err => {
                    showNotification('Error processing PDF file.', 'error');
                    console.error(err);
                });
            };
            reader.readAsArrayBuffer(file);
        } else if (fileType === 'application/json') {
            reader.onload = (e) => processJsonData(e.target.result);
            reader.readAsText(file);
        }
    }

    function processData(data) {
        const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length === 0) {
            showNotification('File is empty or contains no valid data.', 'error');
            return;
        }

        const parsedData = {};
        let currentCategory = null;
        // Regex to match the new format: [Name Ch Chapter](URL)
        const entryRegex = /^\s*\[(.+?)\s+Ch\s+([\d.]+)\]\((.+)\)\s*$/i;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            const entryMatch = trimmedLine.match(entryRegex);

            if (entryMatch) {
                // This is a manga/manhwa entry
                if (currentCategory) {
                    const name = entryMatch[1].trim();
                    const chapter = parseFloat(entryMatch[2]);
                    const imageUrl = entryMatch[3].trim();

                    if (name) {
                        parsedData[currentCategory].push({ name, chapter, imageUrl });
                    }
                } else {
                    // This case handles entries that appear before any category header.
                    // You might want to log this or assign them to a default category.
                    console.warn(`Found an entry without a category: ${trimmedLine}`);
                }
            } else if (trimmedLine) {
                // Any non-matching, non-empty line is considered a category header
                currentCategory = trimmedLine;
                if (!parsedData[currentCategory]) {
                    parsedData[currentCategory] = [];
                }
            }
        });

        categoriesData = parsedData;
        
        // This function will now primarily render the data, as image URLs are provided.
        // It will still fetch covers for any entries that might have a placeholder URL.
        fetchImagesAndRender();

        // Show/hide relevant containers
        sidebarUploadContainer.classList.remove('hidden');
        downloadContainer.classList.remove('hidden');
        addCategorySidebarBtn.classList.remove('hidden');
        saveUserData(); // Save after importing data
    }

    function processJsonData(jsonData) {
        try {
            const parsedData = JSON.parse(jsonData);
            // Basic validation to ensure it's in the expected format
            if (typeof parsedData === 'object' && parsedData !== null) {
                categoriesData = parsedData;
                fetchImagesAndRender(); // This will only fetch images for entries that are missing them
                showNotification('JSON file loaded successfully!', 'success');

                // Show/hide relevant containers
                sidebarUploadContainer.classList.remove('hidden');
                downloadContainer.classList.remove('hidden');
                addCategorySidebarBtn.classList.remove('hidden');
                saveUserData(); // Save after importing JSON
            } else {
                throw new Error('Invalid JSON format.');
            }
        } catch (error) {
            showNotification(`Error processing JSON file: ${error.message}`, 'error');
            console.error(error);
        }
    }

    /**
     * Fetches a manga cover from the Jikan API.
     * @param {string} mangaName - The title of the manga to search for.
     * @returns {Promise<string|null>} A promise that resolves to the cover image URL or null.
     */
    async function fetchCoverFromJikan(mangaName) {
        // Add a small delay to each request to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

        const apiUrl = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(mangaName)}&limit=1`;

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                // Handle rate limiting or other API errors
                if (response.status === 429) {
                    console.warn('Rate limited by Jikan API. Please wait before trying again.');
                    showNotification('API rate limit hit. Please wait.', 'warn');
                } else {
                    console.warn(`Jikan API request failed for "${mangaName}" with status: ${response.status}`);
                }
                return null;
            }

            const data = await response.json();

            if (data.data && data.data.length > 0) {
                const imageUrl = data.data[0]?.images?.jpg?.image_url;
                if (imageUrl) {
                    console.log(`Found cover on Jikan for "${mangaName}":`, imageUrl);
                    return imageUrl;
                }
            }

            console.warn(`Could not find cover for "${mangaName}" on Jikan.`);
            return null;

        } catch (error) {
            console.error(`Error fetching from Jikan API for \"${mangaName}\":`, error);
            return null;
        }
    }

    async function fetchImagesAndRender() {
        tablesContainer.innerHTML = '<p class="text-white text-center text-lg">Searching for cover images, please wait...</p>';
        showNotification('Fetching cover images...', 'info');

        const defaultImageUrl = 'https://shorturl.at/JpeLA';
        // Create a flat list of all entries that need their images fetched.
        const entriesToFetch = Object.values(categoriesData).flat().filter(entry => !entry.imageUrl || entry.imageUrl === defaultImageUrl);

        if (entriesToFetch.length > 0) {
            console.log(`Found ${entriesToFetch.length} entries to fetch images for.`);
            // Process entries in chunks to avoid rate limiting
            const chunkSize = 2;
            for (let i = 0; i < entriesToFetch.length; i += chunkSize) {
                const chunk = entriesToFetch.slice(i, i + chunkSize);
                const fetchPromises = chunk.map(entry =>
                    fetchCoverFromJikan(entry.name).then(imageUrl => { // Use Jikan directly
                        if (imageUrl) {
                            entry.imageUrl = imageUrl;
                        } else {
                            // If not found, keep the default URL
                            entry.imageUrl = defaultImageUrl;
                        }
                    })
                );
                await Promise.allSettled(fetchPromises);
                console.log(`Processed chunk ${i / chunkSize + 1}`);
                // After processing a chunk, re-render to show progress
                renderAllTables(); 
                // Optional: add a longer delay between chunks if still facing issues
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay between chunks
            }
            showNotification('Finished fetching all images.', 'success');
        } else {
            // If no images need to be fetched, just render.
            console.log("No new images to fetch. Rendering from existing data.");
        }

        renderAllTables();
        updateSidebarLinks();
        updateTotalCount();
    }

    function renderAllTables() {
        tablesContainer.innerHTML = '';
        const categoryKeys = Object.keys(categoriesData);

        categoryKeys.forEach((categoryName, index) => {
            const entries = categoriesData[categoryName];
            if (entries) {
                const tableWrapper = document.createElement('div');
                tableWrapper.id = `table-container-${categoryName.replace(/\s+/g, '-')}`;
                tableWrapper.className = 'table-container-glass p-6 rounded-lg shadow-lg mt-8 scroll-mt-24';
                tablesContainer.appendChild(tableWrapper);
                // Pass index and total length for arrow visibility
                renderTable(categoryName, entries, index, categoryKeys.length);
            }
        });
    }

    function updateSidebarLinks() {
        sidebarLinks.innerHTML = '';
        const categoryKeys = Object.keys(categoriesData);

        categoryKeys.forEach((categoryName, index) => {
            const entries = categoriesData[categoryName];
            if (entries) {
                const categoryId = `table-container-${categoryName.replace(/\s+/g, '-')}`;
                const listItem = document.createElement('li');
                listItem.className = 'flex justify-between items-center group'; // Add group for hover effects

                listItem.innerHTML = `
                    <a href="#${categoryId}" class="block text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition-colors duration-200 flex-grow">${categoryName}</a>
                    <div class="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                        <button class="sidebar-move-up-btn text-white hover:text-red-400 text-xs ${index === 0 ? 'invisible' : ''}" data-category="${categoryName}" title="Move Up">▲</button>
                        <button class="sidebar-move-down-btn text-white hover:text-red-400 text-xs ${index === categoryKeys.length - 1 ? 'invisible' : ''}" data-category="${categoryName}" title="Move Down">▼</button>
                    </div>
                `;
                sidebarLinks.appendChild(listItem);
            }
        });
    }

    function updateTotalCount() {
        let totalEntries = 0;
        Object.values(categoriesData).forEach(entries => {
            totalEntries += entries.length;
        });
        totalCountDisplay.textContent = `Total Manga: ${totalEntries}`;
    }

    /**
     * Renders a single table for a given category.
     * @param {string} category - The category name.
     * @param {Array<Object>} entries - The list of entries for the category.
     * @param {number} index - The index of the category.
     * @param {number} total - The total number of categories.
     */
    function renderTable(category, entries, index, total) {
        const categoryId = category.replace(/\s+/g, '-');
        const tableContainer = document.getElementById(`table-container-${categoryId}`);
        if (!tableContainer) return;

        // Sort entries by name within the table
        entries.sort((a, b) => a.name.localeCompare(b.name));

        const tableHTML = `
            <h2 id="${categoryId}" class="category-header text-2xl font-bold italic text-red-500 text-center mb-4 relative">
                <!-- Default View -->
                <div class="category-view group">
                    <div class="flex items-center justify-center relative w-full">
                        <span class="px-16">${category}</span>
                        <div class="absolute right-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="rename-category-btn bg-yellow-500 hover:bg-yellow-600 text-white font-bold p-2 rounded-full text-xs" data-category="${category}" title="Rename Category">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>
                            </button>
                            <button class="delete-category-btn bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded-full text-xs" data-category="${category}" title="Delete Category">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                            <button class="add-entry-btn bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-full text-xs" data-category="${category}" title="Add Entry">+</button>
                        </div>
                    </div>
                </div>
                <!-- Rename View -->
                <div class="category-rename-form hidden">
                    <div class="flex justify-center items-center space-x-2">
                        <input type="text" class="rename-input bg-gray-800 text-white w-1/2 p-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-500" value="${category}">
                        <button class="save-rename-btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm" data-old-name="${category}">Save</button>
                        <button class="cancel-rename-btn bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md text-sm">Cancel</button>
                    </div>
                </div>
                <!-- Delete Confirmation View -->
                <div class="category-delete-confirm hidden">
                    <div class="flex justify-center items-center space-x-4">
                        <span class="text-white">Are you sure?</span>
                        <button class="confirm-delete-btn bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md text-sm" data-category="${category}">Yes, Delete</button>
                        <button class="cancel-delete-btn bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md text-sm">No</button>
                    </div>
                </div>
            </h2>
            <div class="overflow-x-auto">
                <table class="min-w-full table-auto">
                    <thead>
                        <tr>
                            <th class="px-4 py-2 text-center">S.No</th>
                            <th class="px-2 py-2 text-center">Cover</th>
                            <th class="px-4 py-2 text-left">Name</th>
                            <th class="px-4 py-2 text-center">Chapter</th>
                            <th class="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entries.map((entry, index) => `
                            <tr data-category="${category}" data-index="${index}" data-action="open-details" class="cursor-pointer hover:bg-gray-800 transition-colors">
                                <td class="border-t border-gray-700 px-4 py-2 text-center">${index + 1}</td>
                                <td class="border-t border-gray-700 px-2 py-2 text-center">
                                    <img src="${entry.imageUrl || 'https://via.placeholder.com/80x120.png?text=No+Image'}" alt="${entry.name}" class="w-20 h-28 object-cover rounded-md mx-auto pointer-events-none">
                                </td>
                                <td class="border-t border-gray-700 px-4 py-2" contenteditable="true" data-field="name" data-action="edit">${entry.name}</td>
                                <td class="border-t border-gray-700 px-4 py-2 text-center" contenteditable="true" data-field="chapter" data-action="edit">${entry.chapter}</td>
                                <td class="border-t border-gray-700 px-4 py-2 text-center">
                                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs" data-action="delete">Delete</button>
                                    <button class="refresh-cover-btn bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs ml-1" data-action="refresh">R</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        tableContainer.innerHTML = tableHTML;
    }

    /**
     * Adds a temporary row with input fields to a table for a new entry.
     * @param {string} category - The category to add the new entry to.
     */
    function addNewEntryRow(category) {
        const categoryId = category.replace(/\s+/g, '-');
        const tableContainer = document.getElementById(`table-container-${categoryId}`);
        if (!tableContainer) return;

        const table = tableContainer.querySelector('table');
        if (!table) return;

        // Prevent adding multiple new rows to the same table
        if (table.querySelector('.new-entry-row')) {
            return;
        }

        const newRow = document.createElement('tr');
        newRow.className = 'new-entry-row'; // Class to identify the temporary row
        newRow.innerHTML = `
            <td class="border-t border-gray-700 px-4 py-2 text-center">${table.rows.length}</td>
            <td class="border-t border-gray-700 px-2 py-2 text-center">
                <input type="file" accept="image/*" class="new-cover-input hidden" onchange="previewImage(event, this)">
                <label class="cursor-pointer">
                    <img src="https://via.placeholder.com/80x120.png?text=Cover+Image" alt="Cover Image" class="new-cover-preview w-20 h-28 object-cover rounded-md mx-auto">
                </label>
            </td>
            <td class="border-t border-gray-700 px-4 py-2"><input type="text" class="new-name-input bg-gray-800 text-white w-full p-1 rounded" placeholder="Name"></td>
            <td class="border-t border-gray-700 px-4 py-2"><input type="text" inputmode="decimal" class="new-chapter-input bg-gray-800 text-white w-20 p-1 rounded" placeholder="Ch"></td>
            <td class="border-t border-gray-700 px-4 py-2 text-center">
                <button class="save-new-btn bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs" data-category="${category}">Save</button>
                <button class="cancel-new-btn bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-xs ml-1">Cancel</button>
            </td>
        `;
        table.tBodies[0].appendChild(newRow);
        newRow.querySelector('.new-name-input').focus(); // Focus on the name input
    }

    // --- Data Update & Delete Logic ---
    tablesContainer.addEventListener('focusout', (e) => {
        const target = e.target.closest('td[contenteditable="true"]');
        if (!target) return;

        const row = target.closest('tr');
        const { category, index, field } = row.dataset;

        if (category && index !== undefined && field) {
            let value = target.textContent.trim();
            if (field === 'chapter') {
                value = parseFloat(value) || 0;
            }
            categoriesData[category][index][field] = value;
            updateTotalCount(); // In case an entry is cleared
        }
    });

    tablesContainer.addEventListener('click', (e) => {
        const target = e.target;
        const action = target.dataset.action || target.closest('[data-action]')?.dataset.action;

        if (action === 'open-details') {
            // Prevent modal from opening when clicking on editable fields or buttons
            if (target.isContentEditable || ['delete', 'refresh', 'edit'].includes(target.dataset.action)) {
                return;
            }
            const row = target.closest('tr');
            const category = row.dataset.category;
            const index = parseInt(row.dataset.index, 10);
            const entry = categoriesData[category]?.[index];
            if (entry) {
                fetchAndDisplayDetails(entry);
            }
        } else if (target.classList.contains('add-entry-btn')) {
            const category = target.dataset.category;
            addNewEntryRow(category);
        } else if (target.closest('.rename-category-btn')) {
            const header = target.closest('.category-header');
            header.querySelector('.category-view').classList.add('hidden');
            header.querySelector('.category-rename-form').classList.remove('hidden');
            header.querySelector('.rename-input').focus();
        } else if (target.closest('.cancel-rename-btn')) {
            const header = target.closest('.category-header');
            header.querySelector('.category-rename-form').classList.add('hidden');
            header.querySelector('.category-view').classList.remove('hidden');
        } else if (target.closest('.save-rename-btn')) {
            const button = target.closest('.save-rename-btn');
            const header = button.closest('.category-header');
            const oldCategoryName = button.dataset.oldName;
            const newCategoryName = header.querySelector('.rename-input').value.trim();

            if (newCategoryName && newCategoryName !== oldCategoryName) {
                if (categoriesData[newCategoryName]) {
                    showNotification(`Category "${newCategoryName}" already exists.`, 'error');
                    return;
                }

                const newCategoriesData = {};
                Object.keys(categoriesData).forEach(key => {
                    if (key === oldCategoryName) {
                        newCategoriesData[newCategoryName] = categoriesData[oldCategoryName];
                    } else {
                        newCategoriesData[key] = categoriesData[key];
                    }
                });
                categoriesData = newCategoriesData;

                renderAllTables();
                updateSidebarLinks();
                showNotification(`Category '${oldCategoryName}' renamed to '${newCategoryName}'.`, 'success');
            }
        } else if (target.closest('.delete-category-btn')) {
            const header = target.closest('.category-header');
            header.querySelector('.category-view').classList.add('hidden');
            header.querySelector('.category-delete-confirm').classList.remove('hidden');
        } else if (target.closest('.cancel-delete-btn')) {
            const header = target.closest('.category-header');
            header.querySelector('.category-delete-confirm').classList.add('hidden');
            header.querySelector('.category-view').classList.remove('hidden');
        } else if (target.closest('.confirm-delete-btn')) {
            const button = target.closest('.confirm-delete-btn');
            const category = button.dataset.category;
            delete categoriesData[category];
            renderAllTables();
            updateSidebarLinks();
            updateTotalCount();
            showNotification(`Category '${category}' deleted.`, 'success');
        } else if (target.classList.contains('delete-btn')) {
            const row = target.closest('tr');
            const category = row.dataset.category;
            const index = parseInt(row.dataset.index, 10);

            if (categoriesData[category]) {
                const entryName = categoriesData[category][index].name;
                categoriesData[category].splice(index, 1);
                renderTable(category, categoriesData[category]);
                updateTotalCount();
                showNotification(`'${entryName}' deleted from '${category}'.`, 'success');
            }
        } else if (target.classList.contains('refresh-cover-btn')) {
            const row = target.closest('tr');
            const category = row.dataset.category;
            const index = parseInt(row.dataset.index, 10);
            const entry = categoriesData[category]?.[index];

            if (entry) {
                const originalButtonText = target.textContent;
                target.disabled = true;
                target.textContent = '...';

                fetchCoverFromJikan(entry.name).then(imageUrl => {
                    entry.imageUrl = imageUrl || 'https://shorturl.at/JpeLA';
                    renderTable(category, categoriesData[category]);
                    showNotification(`Cover for '${entry.name}' updated.`, 'success');
                }).catch(() => {
                    // Re-enable the button on failure
                    const refreshedRow = document.querySelector(`tr[data-category="${category}"][data-index="${index}"]`);
                    const button = refreshedRow?.querySelector('.refresh-cover-btn');
                    if(button) {
                        button.disabled = false;
                        button.textContent = originalButtonText;
                    }
                    showNotification(`Failed to update cover for '${entry.name}'.`, 'error');
                });
            }
        } else if (target.classList.contains('save-new-btn')) {
            const category = target.dataset.category;
            const row = target.closest('tr');
            const nameInput = row.querySelector('.new-name-input');
            const chapterInput = row.querySelector('.new-chapter-input');
            const coverInput = row.querySelector('.new-cover-input');
            const name = nameInput.value.trim();
            const chapter = chapterInput.value.trim();

            if (name && chapter && !isNaN(chapter)) {
                const newEntry = { name, chapter: parseFloat(chapter), imageUrl: '' };

                const saveEntry = () => {
                    if (categoriesData[category]) {
                        categoriesData[category].push(newEntry);
                        renderTable(category, categoriesData[category]);
                        updateTotalCount();
                        showNotification(`'${newEntry.name}' added to '${category}'.`, 'success');
                    }
                };

                // Handle image URL
                if (coverInput.files.length > 0) {
                    const file = coverInput.files[0];
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        newEntry.imageUrl = e.target.result;
                        saveEntry();
                    };
                    reader.readAsDataURL(file);
                } else {
                    // If no file is provided, fetch from Jikan
                    target.disabled = true; // Disable button to prevent double-clicking
                    target.textContent = 'Searching...';
                    fetchCoverFromJikan(name).then(imageUrl => {
                        newEntry.imageUrl = imageUrl || 'https://shorturl.at/JpeLA';
                        saveEntry();
                    }).catch(() => {
                        newEntry.imageUrl = 'https://shorturl.at/JpeLA';
                        saveEntry();
                    });
                }
            } else {
                showNotification('Please fill in both name and a valid chapter number.', 'error');
            }
        } else if (target.classList.contains('cancel-new-btn')) {
            const row = target.closest('tr');
            row.remove();
        } else if (target.classList.contains('new-cover-preview')) {
            const fileInput = target.closest('tr').querySelector('.new-cover-input');
            if (fileInput) {
                fileInput.click();
            }
        }
    });

    // --- Download Logic ---
    function generateTextContent() {
        let content = '';
        Object.keys(categoriesData).forEach(categoryName => {
            const entries = categoriesData[categoryName];
            if (entries && entries.length > 0) {
                content += `${categoryName}\n\n`;
                // Sort before generating text
                entries.sort((a, b) => a.name.localeCompare(b.name));
                entries.forEach(entry => {
                    // Append the image URL in parentheses
                    content += `[${entry.name} Ch ${entry.chapter}](${entry.imageUrl || ''})\n`;
                });
                content += '\n';
            }
        });
        return content;
    }

    downloadTxtBtn.addEventListener("click", () => {
        const textContent = generateTextContent();
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'manga-list.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Manga list downloaded as manga-list.txt', 'success');
    });

    downloadJsonBtn.addEventListener('click', () => {
        const jsonContent = JSON.stringify(categoriesData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'manga-list.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Manga list downloaded as manga-list.json', 'success');
    });

    downloadPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 15;
        const pageHeight = doc.internal.pageSize.height;

        Object.keys(categoriesData).forEach(categoryName => {
            const entries = categoriesData[categoryName];
            if (entries && entries.length > 0) {
                if (y > pageHeight - 20) { doc.addPage(); y = 15; }
                doc.setFontSize(16);
                doc.text(categoryName, 10, y);
                y += 10;

                doc.setFontSize(12);
                // Sort before generating PDF
                entries.sort((a, b) => a.name.localeCompare(b.name));
                entries.forEach(entry => {
                    if (y > pageHeight - 10) { doc.addPage(); y = 15; }
                    // Append the image URL in parentheses to the PDF text
                    doc.text(`[${entry.name} Ch ${entry.chapter}](${entry.imageUrl || ''})`, 15, y);
                    y += 7;
                });
                y += 5;
            }
        });
        doc.save('manga-list.pdf');
        showNotification('Manga list downloaded as manga-list.pdf', 'success');
    });

    // --- Authentication Functions ---
    async function register(username, password) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                showNotification('Registration successful! Please login.', 'success');
                showLogin();
            } else {
                const error = await response.text();
                showNotification(error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('Registration failed. Please check your connection.', 'error');
        }
    }

    async function login(username, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                showNotification(`Welcome back, ${username}!`, 'success');
                showApp();
                loadUserData();
            } else {
                const error = await response.text();
                showNotification(error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Login failed. Please check your connection.', 'error');
        }
    }

    function logout() {
        localStorage.removeItem('token');
        categoriesData = {};
        showNotification('Logged out successfully', 'success');
        showAuth();
    }

    async function loadUserData() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/list`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                categoriesData = data;
                fetchImagesAndRender();
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                showAuth();
                showNotification('Session expired. Please login again.', 'error');
            } else {
                showNotification('Failed to load your data', 'error');
            }
        } catch (error) {
            console.error('Load data error:', error);
            showNotification('Failed to load data. Please check your connection.', 'error');
        }
    }

    async function saveUserData() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(categoriesData)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    showAuth();
                    showNotification('Session expired. Please login again.', 'error');
                } else {
                    console.error('Save data error:', response.statusText);
                }
            }
        } catch (error) {
            console.error('Save data error:', error);
        }
    }

    // --- UI State Management ---
    function showAuth() {
        authContainer.classList.remove('hidden');
        createContainer.classList.add('hidden');
        tablesContainer.innerHTML = '';
        logoutBtn.classList.add('hidden');
        sidebarUploadContainer.classList.add('hidden');
        downloadContainer.classList.add('hidden');
        addCategorySidebarBtn.classList.add('hidden');
    }

    function showApp() {
        authContainer.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
    }

    function showLogin() {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    }

    function showRegister() {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }

    // --- Auth Event Listeners ---
    loginForm.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        if (username && password) {
            login(username, password);
        }
    });

    registerForm.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value.trim();
        if (username && password) {
            register(username, password);
        }
    });

    showRegisterLink.addEventListener('click', showRegister);
    showLoginLink.addEventListener('click', showLogin);
    logoutBtn.addEventListener('click', logout);

    // Modified functions to save data after changes
    const originalAddCategoryBtnClick = addCategoryBtn.onclick;
    addCategoryBtn.addEventListener('click', () => {
        const categoryName = newCategoryInput.value.trim();
        if (categoryName && !categoriesData[categoryName]) {
            categoriesData[categoryName] = [];
            renderAllTables();
            updateSidebarLinks();
            newCategoryInput.value = '';
            showNotification(`Category '${categoryName}' created successfully.`, 'success');
            saveUserData();
            const newTableId = `table-container-${categoryName.replace(/\s+/g, '-')}`;
            document.getElementById(newTableId)?.scrollIntoView({ behavior: 'smooth' });
        } else if (categoriesData[categoryName]) {
            showNotification('Category already exists.', 'error');
        }
    });

    // Override data modification functions to trigger save
    const originalFocusOutHandler = tablesContainer.querySelector ? null : 'dummy';
    tablesContainer.addEventListener('focusout', (e) => {
        const target = e.target.closest('td[contenteditable="true"]');
        if (!target) return;

        const row = target.closest('tr');
        const { category, index } = row.dataset;
        const field = target.dataset.field;

        if (category && index !== undefined && field) {
            let value = target.textContent.trim();
            if (field === 'chapter') {
                value = parseFloat(value) || 0;
            }
            categoriesData[category][index][field] = value;
            updateTotalCount();
            saveUserData(); // Save after editing
        }
    });

    // --- Initialization ---
    function initApp() {
        const token = localStorage.getItem('token');
        if (token) {
            showApp();
            loadUserData();
        } else {
            showAuth();
        }
    }

    // Start the app
    initApp();
});
