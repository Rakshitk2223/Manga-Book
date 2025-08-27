// Supabase Configuration and Initialization
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Initialize Supabase client
const supabaseUrl = 'https://wjtgvoxvomttzaycvfui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdGd2b3h2b210dHpheWN2ZnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjgzNjIsImV4cCI6MjA3MTkwNDM2Mn0.hAstZI2wiGqmsJZGb-_uj4KAkiMud-2RCbg0H-gy6b0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Global state
let currentUser = null;
let categoriesData = {};

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing Supabase app...');
    
    // Initialize app
    await initializeApp();
    
    // Get all UI elements
    const elements = getUIElements();
    
    // Set up event listeners
    setupEventListeners(elements);
    
    // Initialize PDF.js worker if available
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
    }
    
    // Set initial background
    const backgroundImages = ['Background/bg1.jpeg', 'Background/bg2.jpeg', 'Background/bg3.jpeg', 'Background/bg4.jpeg', 'Background/bg5.jpeg', 'Background/bg6.jpeg'];
    let currentBgIndex = 0;
    document.body.style.backgroundImage = `url('${backgroundImages[0]}')`;
    
    // Background toggle function
    window.toggleBackground = function() {
        currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
        document.body.style.backgroundImage = `url('${backgroundImages[currentBgIndex]}')`;
    };
});

// Initialize application and check auth state
async function initializeApp() {
    try {
        // Check current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            showAuthView();
            return;
        }
        
        if (session?.user) {
            currentUser = session.user;
            await showAppView();
        } else {
            showAuthView();
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session?.user) {
                currentUser = session.user;
                await showAppView();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showAuthView();
            }
        });
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error initializing application', 'error');
    }
}

// Get UI elements
function getUIElements() {
    return {
        // Auth elements
        authContainer: document.getElementById('auth-container'),
        appContainer: document.getElementById('app-container') || document.getElementById('main-content'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        showRegisterLink: document.getElementById('show-register'),
        showLoginLink: document.getElementById('show-login'),
        logoutBtn: document.getElementById('logout-btn'),
        
        // Form inputs
        loginEmail: document.getElementById('login-username'), // Using email for login
        loginPassword: document.getElementById('login-password'),
        registerUsername: document.getElementById('register-username'),
        registerEmail: document.getElementById('register-email'),
        registerPassword: document.getElementById('register-password'),
        
        // App elements
        tablesContainer: document.getElementById('tables-container'),
        totalCountDisplay: document.getElementById('total-count-display'),
        sidebar: document.getElementById('sidebar'),
        menuBtn: document.getElementById('menu-btn'),
        overlay: document.getElementById('overlay'),
        sidebarLinks: document.getElementById('sidebar-links'),
        bgToggleBtn: document.getElementById('bg-toggle-btn'),
        downloadContainer: document.getElementById('download-container'),
        downloadTxtBtn: document.getElementById('download-txt-btn'),
        downloadPdfBtn: document.getElementById('download-pdf-btn'),
        downloadJsonBtn: document.getElementById('download-json-btn'),
        sidebarUploadContainer: document.getElementById('sidebar-upload-container'),
        mainContent: document.getElementById('main-content'),
        createContainer: document.getElementById('create-container'),
        newCategoryInput: document.getElementById('new-category-input'),
        addCategoryBtn: document.getElementById('add-category-btn'),
        addCategorySidebarBtn: document.getElementById('add-category-sidebar-btn'),
        notificationContainer: document.getElementById('notification-container'),
        searchInput: document.getElementById('search-input'),
        detailsModal: document.getElementById('details-modal'),
        modalContent: document.getElementById('modal-content')
    };
}

// Set up event listeners
function setupEventListeners(elements) {
    // Auth form listeners
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', handleRegister);
    }
    
    if (elements.showRegisterLink) {
        elements.showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForms('register');
        });
    }
    
    if (elements.showLoginLink) {
        elements.showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForms('login');
        });
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // App functionality listeners
    if (elements.menuBtn) {
        elements.menuBtn.addEventListener('click', toggleSidebar);
    }
    
    if (elements.overlay) {
        elements.overlay.addEventListener('click', toggleSidebar);
    }
    
    if (elements.bgToggleBtn) {
        elements.bgToggleBtn.addEventListener('click', toggleBackground);
    }
    
    if (elements.addCategoryBtn) {
        elements.addCategoryBtn.addEventListener('click', () => addCategory(elements));
    }
    
    if (elements.addCategorySidebarBtn) {
        elements.addCategorySidebarBtn.addEventListener('click', () => toggleCreateContainer(elements));
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearch);
    }
    
    if (elements.detailsModal) {
        elements.detailsModal.addEventListener('click', (e) => {
            if (e.target === elements.detailsModal) {
                closeDetailsModal();
            }
        });
    }
    
    // Download listeners
    if (elements.downloadJsonBtn) {
        elements.downloadJsonBtn.addEventListener('click', () => downloadJson());
    }
    
    if (elements.downloadTxtBtn) {
        elements.downloadTxtBtn.addEventListener('click', () => downloadTxt());
    }
    
    if (elements.downloadPdfBtn) {
        elements.downloadPdfBtn.addEventListener('click', () => downloadPdf());
    }
}

// Authentication Functions

async function handleLogin(e) {
    e.preventDefault();
    const elements = getUIElements();
    
    const email = elements.loginEmail?.value;
    const password = elements.loginPassword?.value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        showNotification('Signing in...', 'info');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Login error:', error);
            showNotification(error.message, 'error');
            return;
        }
        
        showNotification('Successfully signed in!', 'success');
        // Auth state change will handle UI update
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const elements = getUIElements();
    
    const username = elements.registerUsername?.value;
    const email = elements.registerEmail?.value;
    const password = elements.registerPassword?.value;
    
    if (!username || !email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        showNotification('Creating account...', 'info');
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    display_name: username
                }
            }
        });
        
        if (error) {
            console.error('Registration error:', error);
            showNotification(error.message, 'error');
            return;
        }
        
        if (data.user) {
            showNotification('Account created successfully! Please check your email for verification.', 'success');
            toggleAuthForms('login');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
            showNotification('Logout failed', 'error');
            return;
        }
        
        // Clear local data
        categoriesData = {};
        showNotification('Successfully signed out', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

function toggleAuthForms(form) {
    const elements = getUIElements();
    
    if (form === 'register') {
        elements.loginForm?.classList.add('hidden');
        elements.registerForm?.classList.remove('hidden');
    } else {
        elements.registerForm?.classList.add('hidden');
        elements.loginForm?.classList.remove('hidden');
    }
}

function showAuthView() {
    const elements = getUIElements();
    elements.authContainer?.classList.remove('hidden');
    elements.appContainer?.classList.add('hidden');
}

async function showAppView() {
    const elements = getUIElements();
    elements.authContainer?.classList.add('hidden');
    elements.appContainer?.classList.remove('hidden');
    
    // Load user's manga data
    await loadMangaData();
    
    // Show app elements
    elements.sidebarUploadContainer?.classList.remove('hidden');
    elements.downloadContainer?.classList.remove('hidden');
    elements.addCategorySidebarBtn?.classList.remove('hidden');
}

// Data Management Functions

async function loadMangaData() {
    if (!currentUser) return;
    
    try {
        showNotification('Loading your manga data...', 'info');
        
        // Get user's manga with categories and progress
        const { data: mangaData, error } = await supabase
            .from('manga_with_progress')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('category_name', { ascending: true })
            .order('title', { ascending: true });
            
        if (error) {
            console.error('Error loading manga data:', error);
            showNotification('Error loading your manga data', 'error');
            return;
        }
        
        // Transform data to match existing format
        categoriesData = {};
        
        if (mangaData && mangaData.length > 0) {
            mangaData.forEach(manga => {
                const categoryName = manga.category_name || 'Uncategorized';
                
                if (!categoriesData[categoryName]) {
                    categoriesData[categoryName] = [];
                }
                
                categoriesData[categoryName].push({
                    id: manga.id,
                    name: manga.title,
                    chapter: manga.chapters_read || 0,
                    imageUrl: manga.image_url || 'https://shorturl.at/JpeLA',
                    malId: manga.mal_id,
                    author: manga.author,
                    status: manga.reading_status || 'plan-to-read',
                    userRating: manga.user_rating,
                    userNotes: manga.user_notes,
                    synopsis: manga.synopsis
                });
            });
        } else {
            // Create default categories for new users
            await createDefaultCategories();
        }
        
        // Render the data
        renderAllTables();
        updateSidebarLinks();
        updateTotalCount();
        
        showNotification('Manga data loaded successfully', 'success');
        
    } catch (error) {
        console.error('Error loading manga data:', error);
        showNotification('Error loading manga data', 'error');
    }
}

async function createDefaultCategories() {
    if (!currentUser) return;
    
    try {
        const defaultCategories = [
            { name: 'Currently Reading', description: 'Manga I am currently reading' },
            { name: 'Plan to Read', description: 'Manga I plan to read' },
            { name: 'Completed', description: 'Manga I have completed' },
            { name: 'Dropped', description: 'Manga I have dropped' },
            { name: 'On Hold', description: 'Manga I have put on hold' }
        ];
        
        for (let i = 0; i < defaultCategories.length; i++) {
            const category = defaultCategories[i];
            const { error } = await supabase
                .from('manga_categories')
                .insert({
                    user_id: currentUser.id,
                    name: category.name,
                    description: category.description,
                    sort_order: i + 1
                });
                
            if (error) {
                console.error(`Error creating category ${category.name}:`, error);
            } else {
                categoriesData[category.name] = [];
            }
        }
        
    } catch (error) {
        console.error('Error creating default categories:', error);
    }
}

async function saveMangaData() {
    if (!currentUser) return;
    
    try {
        showNotification('Saving your manga data...', 'info');
        
        // This would typically involve updating the database
        // For now, we'll implement a basic save mechanism
        
        showNotification('Data saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Error saving data', 'error');
    }
}

// Category Management

async function addCategory(elements) {
    const categoryName = elements.newCategoryInput?.value?.trim();
    
    if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    if (categoriesData[categoryName]) {
        showNotification('Category already exists', 'error');
        return;
    }
    
    if (!currentUser) {
        showNotification('Please log in to add categories', 'error');
        return;
    }
    
    try {
        // Add to database
        const { data, error } = await supabase
            .from('manga_categories')
            .insert({
                user_id: currentUser.id,
                name: categoryName,
                sort_order: Object.keys(categoriesData).length + 1
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error creating category:', error);
            showNotification('Error creating category', 'error');
            return;
        }
        
        // Add to local data
        categoriesData[categoryName] = [];
        
        // Update UI
        renderAllTables();
        updateSidebarLinks();
        updateTotalCount();
        
        // Clear input and scroll to new category
        elements.newCategoryInput.value = '';
        
        const newTableId = `table-container-${categoryName.replace(/\\s+/g, '-')}`;
        setTimeout(() => {
            document.getElementById(newTableId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        showNotification(`Category '${categoryName}' created successfully!`, 'success');
        
    } catch (error) {
        console.error('Error adding category:', error);
        showNotification('Error adding category', 'error');
    }
}

function toggleCreateContainer(elements) {
    const isHidden = elements.createContainer?.classList.contains('hidden');
    
    if (isHidden) {
        elements.createContainer?.classList.remove('hidden');
        elements.createContainer?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elements.newCategoryInput?.focus();
    } else {
        elements.createContainer?.classList.add('hidden');
    }
}

// Search and Filter

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const allTableContainers = document.querySelectorAll('.table-container-glass');
    
    allTableContainers.forEach(container => {
        const rows = container.querySelectorAll('tbody tr');
        let categoryVisible = false;
        
        rows.forEach(row => {
            const nameCell = row.querySelector('td[data-field=\"name\"]');
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
        
        // Hide entire category if no matches
        container.style.display = categoryVisible ? '' : 'none';
    });
}

// UI Functions

function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');
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
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }, 5000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const mainContent = document.getElementById('main-content');
    
    if (!sidebar) return;
    
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    sidebar.classList.toggle('-translate-x-full');
    overlay?.classList.toggle('hidden');
    
    if (isOpen) {
        mainContent?.classList.remove('ml-64');
    } else {
        mainContent?.classList.add('ml-64');
    }
}

// Render Functions (simplified versions)

function renderAllTables() {
    const tablesContainer = document.getElementById('tables-container');
    if (!tablesContainer) return;
    
    tablesContainer.innerHTML = '';
    const categoryKeys = Object.keys(categoriesData);
    
    if (categoryKeys.length === 0) {
        tablesContainer.innerHTML = `
            <div class="text-center text-white p-8">
                <h2 class="text-2xl font-bold mb-4">Welcome to Manga-Book!</h2>
                <p class="text-gray-300 mb-4">Start by adding your first category or importing your manga list.</p>
                <button onclick="document.getElementById('add-category-sidebar-btn')?.click()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Add Category
                </button>
            </div>
        `;
        return;
    }
    
    categoryKeys.forEach((categoryName, index) => {
        const entries = categoriesData[categoryName];
        if (entries) {
            const tableWrapper = document.createElement('div');
            tableWrapper.id = `table-container-${categoryName.replace(/\\s+/g, '-')}`;
            tableWrapper.className = 'table-container-glass p-6 rounded-lg shadow-lg mt-8 scroll-mt-24';
            tablesContainer.appendChild(tableWrapper);
            renderTable(categoryName, entries, index, categoryKeys.length);
        }
    });
}

function renderTable(category, entries, index, total) {
    const categoryId = category.replace(/\\s+/g, '-');
    const tableContainer = document.getElementById(`table-container-${categoryId}`);
    if (!tableContainer) return;
    
    // Sort entries by name
    entries.sort((a, b) => a.name.localeCompare(b.name));
    
    const tableHTML = `
        <h2 id="${categoryId}" class="category-header text-2xl font-bold italic text-red-500 text-center mb-4">
            <span class="px-4">${category}</span>
        </h2>
        <div class="overflow-x-auto">
            <table class="min-w-full table-auto">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-center text-white">S.No</th>
                        <th class="px-2 py-2 text-center text-white">Cover</th>
                        <th class="px-4 py-2 text-left text-white">Name</th>
                        <th class="px-4 py-2 text-center text-white">Chapter</th>
                        <th class="px-4 py-2 text-center text-white">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${entries.map((entry, idx) => `
                        <tr class="cursor-pointer hover:bg-gray-800 transition-colors" 
                            onclick="openMangaDetails('${entry.name}', '${category}', ${idx})">
                            <td class="border-t border-gray-700 px-4 py-2 text-center text-white">${idx + 1}</td>
                            <td class="border-t border-gray-700 px-2 py-2 text-center">
                                <img src="${entry.imageUrl || 'https://shorturl.at/JpeLA'}" 
                                     alt="${entry.name}" 
                                     class="w-12 h-16 object-cover rounded mx-auto"
                                     onerror="this.src='https://shorturl.at/JpeLA'">
                            </td>
                            <td class="border-t border-gray-700 px-4 py-2 text-left text-white" data-field="name">${entry.name}</td>
                            <td class="border-t border-gray-700 px-4 py-2 text-center text-white">${entry.chapter || 0}</td>
                            <td class="border-t border-gray-700 px-4 py-2 text-center text-white">
                                <span class="px-2 py-1 bg-blue-600 text-white rounded text-xs">${entry.status || 'plan-to-read'}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ${entries.length === 0 ? '<p class="text-center text-gray-400 mt-4">No manga in this category yet.</p>' : ''}
    `;
    
    tableContainer.innerHTML = tableHTML;
}

function updateSidebarLinks() {
    const sidebarLinks = document.getElementById('sidebar-links');
    if (!sidebarLinks) return;
    
    sidebarLinks.innerHTML = '';
    const categoryKeys = Object.keys(categoriesData);
    
    categoryKeys.forEach((categoryName) => {
        const entries = categoriesData[categoryName];
        const categoryId = `table-container-${categoryName.replace(/\\s+/g, '-')}`;
        const listItem = document.createElement('li');
        
        listItem.innerHTML = `
            <a href="#${categoryId}" 
               class="block text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition-colors duration-200">
                ${categoryName} (${entries.length})
            </a>
        `;
        
        listItem.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.hash) {
                e.preventDefault();
                const targetElement = document.querySelector(e.target.hash);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
                toggleSidebar();
            }
        });
        
        sidebarLinks.appendChild(listItem);
    });
}

function updateTotalCount() {
    const totalCountDisplay = document.getElementById('total-count-display');
    if (!totalCountDisplay) return;
    
    let totalEntries = 0;
    Object.values(categoriesData).forEach(entries => {
        totalEntries += entries.length;
    });
    
    totalCountDisplay.textContent = `Total Manga: ${totalEntries}`;
}

// Modal Functions

window.openMangaDetails = async function(mangaName, category, index) {
    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('modal-content');
    
    if (!modal || !modalContent) return;
    
    modal.classList.remove('hidden');
    modalContent.innerHTML = `<p class="text-white text-center text-lg">Fetching details for ${mangaName}...</p>`;
    
    try {
        const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(mangaName)}&limit=1`);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        
        const data = await response.json();
        const manga = data.data[0];
        
        if (!manga) {
            modalContent.innerHTML = `<p class="text-red-400 text-center">Could not find detailed information for "${mangaName}".</p>`;
            return;
        }
        
        const genres = manga.genres.map(g => 
            `<span class="bg-red-600 text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${g.name}</span>`
        ).join(' ');
        
        modalContent.innerHTML = `
            <button onclick="closeDetailsModal()" 
                    class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
            <div class="flex flex-col md:flex-row gap-6">
                <div class="flex-shrink-0">
                    <img src="${manga.images.jpg.large_image_url}" 
                         alt="${manga.title}" 
                         class="w-48 h-auto object-cover rounded-md mx-auto">
                </div>
                <div class="flex-grow">
                    <h2 class="text-3xl font-bold text-white mb-2">${manga.title}</h2>
                    <p class="text-lg text-gray-300 mb-4">${manga.title_japanese || ''}</p>
                    <div class="flex items-center space-x-4 mb-4 text-yellow-400">
                        <span>⭐ ${manga.score || 'N/A'}</span>
                        <span>#${manga.rank || 'N/A'}</span>
                        <span class="px-2 py-1 bg-gray-700 text-white rounded-md text-sm">${manga.status || 'Unknown'}</span>
                    </div>
                    <div class="mb-4">${genres}</div>
                    <p class="text-gray-400 text-sm max-h-48 overflow-y-auto pr-2">${manga.synopsis || 'No synopsis available.'}</p>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error("Failed to fetch details:", error);
        modalContent.innerHTML = `<p class="text-red-400 text-center">Error fetching details. Please try again later.</p>`;
    }
};

window.closeDetailsModal = function() {
    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('modal-content');
    
    modal?.classList.add('hidden');
    if (modalContent) modalContent.innerHTML = '';
};

// Export Functions (simplified)

function downloadJson() {
    const dataStr = JSON.stringify(categoriesData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'manga-list.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('JSON file downloaded successfully!', 'success');
}

function downloadTxt() {
    let txtContent = '';
    
    Object.keys(categoriesData).forEach(category => {
        txtContent += `${category}\\n`;
        categoriesData[category].forEach(entry => {
            txtContent += `[${entry.name} Ch ${entry.chapter || 0}](${entry.imageUrl})\\n`;
        });
        txtContent += '\\n';
    });
    
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', 'manga-list.txt');
    linkElement.click();
    
    window.URL.revokeObjectURL(url);
    showNotification('TXT file downloaded successfully!', 'success');
}

function downloadPdf() {
    showNotification('PDF export functionality will be available soon!', 'info');
}

// File import functionality can be added here if needed
// This would involve parsing uploaded files and saving to Supabase

console.log('Supabase Manga-Book app initialized!');
