// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selections ---
    const fileInput = document.getElementById('file-upload');
    const fileInputSidebar = document.getElementById('file-input-sidebar');
    const errorMessage = document.getElementById('error-message');
    const tablesContainer = document.getElementById('tables-container');
    const totalCountDisplay = document.getElementById('total-count-display');
    const uploadContainer = document.getElementById('upload-container');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const overlay = document.getElementById('overlay');
    const sidebarLinks = document.getElementById('sidebar-links');
    const bgToggleBtn = document.getElementById('bg-toggle-btn');
    const downloadContainer = document.getElementById('download-container');
    const downloadTxtBtn = document.getElementById('download-txt-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadJsonBtn = document.getElementById('download-json-btn'); // Get the button from HTML
    const sidebarUploadContainer = document.getElementById('sidebar-upload-container');
    const mainContent = document.getElementById('main-content');

    // Set the worker source for PDF.js
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
    }

    // --- Global Data Store ---
    let categoriesData = {};

    // --- UI Interaction Logic ---

    // Background Image Toggle
    const backgroundImages = ['Background/bg1.jpeg', 'Background/bg2.jpeg', 'Background/bg3.jpeg'];
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

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    overlay.addEventListener('click', toggleSidebar);

    sidebarLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && e.target.hash) {
            e.preventDefault();
            const targetElement = document.querySelector(e.target.hash);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            toggleSidebar();
        }
    });

    // --- File Processing Logic ---
    function handleFile(file) {
        if (!file) return;

        const fileType = file.type;
        if (fileType !== 'text/plain' && fileType !== 'application/pdf' && fileType !== 'application/json') {
            errorMessage.textContent = 'Error: Please upload a .txt, .pdf or .json file.';
            return;
        }

        errorMessage.textContent = '';
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
                    errorMessage.textContent = 'Error processing PDF file.';
                    console.error(err);
                });
            };
            reader.readAsArrayBuffer(file);
        } else if (fileType === 'application/json') {
            reader.onload = (e) => processJsonData(e.target.result);
            reader.readAsText(file);
        }
    }

    fileInput.addEventListener('change', (event) => handleFile(event.target.files[0]));
    fileInputSidebar.addEventListener('change', (event) => handleFile(event.target.files[0]));

    function processData(data) {
        const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length === 0) {
            errorMessage.textContent = 'File is empty or contains no valid data.';
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
        uploadContainer.style.display = 'none';
        sidebarUploadContainer.classList.remove('hidden');
        downloadContainer.classList.remove('hidden');
    }

    function processJsonData(jsonData) {
        try {
            const parsedData = JSON.parse(jsonData);
            // Basic validation to ensure it's in the expected format
            if (typeof parsedData === 'object' && parsedData !== null) {
                categoriesData = parsedData;
                fetchImagesAndRender(); // This will only fetch images for entries that are missing them

                // Show/hide relevant containers
                uploadContainer.style.display = 'none';
                sidebarUploadContainer.classList.remove('hidden');
                downloadContainer.classList.remove('hidden');
            } else {
                throw new Error('Invalid JSON format.');
            }
        } catch (error) {
            errorMessage.textContent = `Error processing JSON file: ${error.message}`;
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
        tablesContainer.innerHTML = '<p class=\"text-white text-center text-lg\">Searching for cover images, please wait...</p>';
        errorMessage.textContent = ''; // Clear previous errors

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
        Object.keys(categoriesData).forEach(categoryName => {
            const entries = categoriesData[categoryName];
            if (entries && entries.length > 0) {
                const tableWrapper = document.createElement('div');
                tableWrapper.id = `table-container-${categoryName.replace(/\s+/g, '-')}`;
                tableWrapper.className = 'table-container-glass p-6 rounded-lg shadow-lg mt-8 scroll-mt-24';
                tablesContainer.appendChild(tableWrapper);
                renderTable(categoryName, entries);
            }
        });
    }

    function updateSidebarLinks() {
        sidebarLinks.innerHTML = '';
        Object.keys(categoriesData).forEach(categoryName => {
            const entries = categoriesData[categoryName];
            if (entries && entries.length > 0) {
                const categoryId = `table-container-${categoryName.replace(/\s+/g, '-')}`;
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="#${categoryId}" class="block text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition-colors duration-200">${categoryName}</a>`;
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
     */
    function renderTable(category, entries) {
        const categoryId = category.replace(/\s+/g, '-');
        const tableContainer = document.getElementById(`table-container-${categoryId}`);
        if (!tableContainer) return;

        // Sort entries by name
        entries.sort((a, b) => a.name.localeCompare(b.name));

        const tableHTML = `
            <h2 id="${categoryId}" class="category-header text-2xl font-bold italic text-red-500 text-center mb-4 relative group">
                ${category}
                <button class="add-entry-btn absolute right-0 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity" data-category="${category}">+</button>
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
                            <tr data-category="${category}" data-index="${index}">
                                <td class="border-t border-gray-700 px-4 py-2 text-center">${index + 1}</td>
                                <td class="border-t border-gray-700 px-2 py-2 text-center">
                                    <img src="${entry.imageUrl || 'https://via.placeholder.com/80x120.png?text=No+Image'}" alt="${entry.name}" class="w-20 h-28 object-cover rounded-md mx-auto">
                                </td>
                                <td class="border-t border-gray-700 px-4 py-2" contenteditable="true" data-field="name">
                                    <div class="glass-container">${entry.name}</div>
                                </td>
                                <td class="border-t border-gray-700 px-4 py-2 text-center" contenteditable="true" data-field="chapter">${entry.chapter}</td>
                                <td class="border-t border-gray-700 px-4 py-2 text-center">\
                                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Delete</button>\
                                    <button class="refresh-cover-btn bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs ml-1">R</button>\
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

        if (target.classList.contains('add-entry-btn')) {
            const category = target.dataset.category;
            addNewEntryRow(category);
        } else if (target.classList.contains('delete-btn')) {
            const row = target.closest('tr');
            const category = row.dataset.category;
            const index = parseInt(row.dataset.index, 10);

            if (categoriesData[category]) {
                categoriesData[category].splice(index, 1);
                renderTable(category, categoriesData[category]);
                updateTotalCount();
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
                }).catch(() => {
                    // Re-enable the button on failure
                    const refreshedRow = document.querySelector(`tr[data-category=\"${category}\"][data-index=\"${index}\"]`);
                    const button = refreshedRow?.querySelector('.refresh-cover-btn');
                    if(button) {
                        button.disabled = false;
                        button.textContent = originalButtonText;
                    }
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
                alert('Please fill in both name and a valid chapter number.');
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
    });

    // Add event listeners for buttons
    bgToggleBtn.addEventListener('click', toggleBackground);
});
