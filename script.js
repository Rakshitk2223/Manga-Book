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
        if (fileType !== 'text/plain' && fileType !== 'application/pdf') {
            errorMessage.textContent = 'Error: Please upload a .txt or .pdf file.';
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
                            page.getTextContent().then(textContent =>
                                textContent.items.map(item => item.str).join(' ')
                            )
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
        }
    }

    fileInput.addEventListener('change', (event) => handleFile(event.target.files[0]));
    fileInputSidebar.addEventListener('change', (event) => handleFile(event.target.files[0]));

    function processData(data) {
        const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
        const PREDEFINED_HEADINGS = ['Manga', 'Manhwa', 'Manhua', 'OG Manhwa', 'OG Manhua', 'NG Manhwa', 'NG Manhua', 'Ero', 'To read', 'Incomplete'];

        if (lines.length === 0) {
            errorMessage.textContent = 'File is empty or contains no valid data.';
            return;
        }

        const parsedData = PREDEFINED_HEADINGS.reduce((acc, h) => ({ ...acc, [h]: [] }), {});
        let currentCategory = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            const isHeading = PREDEFINED_HEADINGS.find(h => h.toLowerCase() === trimmedLine.toLowerCase());

            if (isHeading) {
                currentCategory = isHeading;
            } else {
                // Updated regex to be more flexible with chapter format, allowing decimals
                const entryMatch = trimmedLine.match(/^\s*\[(.*?)(?:Ch\s*([\d.]+))?\s*\]\s*$/i);
                if (entryMatch && currentCategory) {
                    const name = entryMatch[1].trim();
                    const chapter = entryMatch[2] ? parseFloat(entryMatch[2]) : 'N/A';
                    if (name) {
                        parsedData[currentCategory].push({ name, chapter });
                    }
                }
            }
        });
        categoriesData = parsedData;
        renderAllTables();
        updateSidebarLinks();
        updateTotalCount();

        // Show/hide relevant containers
        uploadContainer.style.display = 'none';
        sidebarUploadContainer.classList.remove('hidden');
        downloadContainer.classList.remove('hidden');
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
                            <th class="px-4 py-2 text-left">Name</th>
                            <th class="px-4 py-2 text-center">Chapter</th>
                            <th class="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entries.map((entry, index) => `
                            <tr data-category="${category}" data-index="${index}">
                                <td class="border-t border-gray-700 px-4 py-2 text-center">${index + 1}</td>
                                <td class="border-t border-gray-700 px-4 py-2" contenteditable="true" data-field="name">
                                    <div class="glass-container">${entry.name}</div>
                                </td>
                                <td class="border-t border-gray-700 px-4 py-2 text-center" contenteditable="true" data-field="chapter">${entry.chapter}</td>
                                <td class="border-t border-gray-700 px-4 py-2 text-center">
                                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Delete</button>
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
        } else if (target.classList.contains('save-new-btn')) {
            const category = target.dataset.category;
            const row = target.closest('tr');
            const nameInput = row.querySelector('.new-name-input');
            const chapterInput = row.querySelector('.new-chapter-input');
            const name = nameInput.value.trim();
            const chapter = chapterInput.value.trim();

            if (name && chapter && !isNaN(chapter)) {
                const newEntry = { name, chapter: parseFloat(chapter) };
                if (categoriesData[category]) {
                    categoriesData[category].push(newEntry);
                    renderTable(category, categoriesData[category]);
                    updateTotalCount();
                }
            } else {
                alert('Please fill in both name and a valid chapter number.');
            }
        } else if (target.classList.contains('cancel-new-btn')) {
            const row = target.closest('tr');
            row.remove();
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
                    content += `[${entry.name} Ch ${entry.chapter}]\n`;
                });
                content += '\n';
            }
        });
        return content;
    }

    downloadTxtBtn.addEventListener('click', () => {
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
                    doc.text(`[${entry.name} Ch ${entry.chapter}]`, 15, y);
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
