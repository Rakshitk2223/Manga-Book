// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

const fileUpload = document.getElementById('file-upload');
const errorMessage = document.getElementById('error-message');
const tablesContainer = document.getElementById('tables-container');
const totalCountFooter = document.getElementById('total-count-footer');

const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menu-btn');
const overlay = document.getElementById('overlay');
const sidebarLinks = document.getElementById('sidebar-links');

// Define the fixed list of headings
const PREDEFINED_HEADINGS = ['Manga', 'Manhwa', 'Manhua', 'OG Manhwa', 'OG Manhua', 'NG Manhwa', 'NG Manhua', 'Ero', 'To read', 'Incomplete'];

// --- Sidebar Logic ---
function toggleSidebar() {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent click from immediately closing sidebar if other listeners exist
    toggleSidebar();
});

overlay.addEventListener('click', toggleSidebar);

sidebarLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.href) {
        // Smooth scroll to the section
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
        // Close sidebar after navigation
        toggleSidebar();
    }
});


// --- File Processing Logic ---
fileUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const fileType = file.type;
    if (fileType !== 'text/plain' && fileType !== 'application/pdf') {
        errorMessage.textContent = 'Error: Please upload a .txt or .pdf file.';
        tablesContainer.innerHTML = '';
        sidebarLinks.innerHTML = '';
        totalCountFooter.style.display = 'none';
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
            });
        };
        reader.readAsArrayBuffer(file);
    }
});

function processData(data) {
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) {
        errorMessage.textContent = 'File is empty or contains no valid data.';
        tablesContainer.innerHTML = '';
        sidebarLinks.innerHTML = '';
        totalCountFooter.style.display = 'none';
        return;
    }

    const categories = PREDEFINED_HEADINGS.reduce((acc, h) => ({...acc, [h]: [] }), {});
    let currentCategory = null;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        const isHeading = PREDEFINED_HEADINGS.find(h => h.toLowerCase() === trimmedLine.toLowerCase());

        if (isHeading) {
            currentCategory = isHeading;
        } else {
            const entryMatch = trimmedLine.match(/^\[(.*?)\s+(Ch\s+\d+)\]$/i);
            if (entryMatch && currentCategory) {
                const name = entryMatch[1].trim();
                const chapters = entryMatch[2];
                if (name) {
                    categories[currentCategory].push({ name, chapters });
                }
            }
        }
    });
    
    renderTablesAndSidebar(categories);
}

function renderTablesAndSidebar(categories) {
    tablesContainer.innerHTML = '';
    sidebarLinks.innerHTML = '';
    let totalEntries = 0;

    PREDEFINED_HEADINGS.forEach(categoryName => {
        const entries = categories[categoryName];

        if (entries && entries.length > 0) {
            totalEntries += entries.length;
            const categoryId = `category-${categoryName.replace(/\s+/g, '-')}`;

            // Add link to sidebar
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="#${categoryId}" class="block text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition-colors duration-200">${categoryName}</a>`;
            sidebarLinks.appendChild(listItem);

            // Create and render the table
            const tableWrapper = document.createElement('div');
            tableWrapper.id = categoryId;
            tableWrapper.className = 'bg-gray-800 p-6 rounded-lg shadow-lg mt-8 scroll-mt-20'; // scroll-mt-20 to offset for header

            const title = document.createElement('h2');
            title.className = 'text-2xl font-semibold mb-4 netflix-red-text';
            title.textContent = categoryName;
            tableWrapper.appendChild(title);

            const table = document.createElement('table');
            table.className = 'w-full text-left';

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr class="border-b border-gray-600">
                    <th class="p-2 w-16">S.No</th>
                    <th class="p-2">Name</th>
                    <th class="p-2 text-right">Chapters Read</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            entries.forEach((entry, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-700';
                row.innerHTML = `
                    <td class="p-2 text-white">${index + 1}</td>
                    <td class="p-2 text-white">${entry.name}</td>
                    <td class="p-2 text-right text-white">${entry.chapters}</td>
                `;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            tableWrapper.appendChild(table);
            
            tablesContainer.appendChild(tableWrapper);
        }
    });

    // Update and display the total count footer
    if (totalEntries > 0) {
        totalCountFooter.textContent = `Total Read Manwha/Manga/Manhua : ${totalEntries}`;
        totalCountFooter.style.display = 'block';
    } else {
        totalCountFooter.style.display = 'none';
    }
}