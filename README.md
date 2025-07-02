# Manga/Comic List Manager

## Overview

This is a single-page web application designed to help users upload, view, and manage their manga and comic book lists efficiently. The application features a modern, dark-themed, and responsive UI inspired by Netflix, providing a user-friendly experience for managing categorized lists. It supports both `.txt` and `.pdf` file uploads and allows for dynamic editing, adding, and deleting of entries, with the ability to download the updated list.

## Key Features

-   **Dynamic File Upload**: Upload your list in `.txt` or `.pdf` format. The app intelligently parses entries formatted as `[Name Ch ChapterNumber]`.
-   **Categorized & Sorted View**: Entries are automatically sorted and grouped into predefined categories (e.g., Manga, Manhwa, Manhua).
-   **Modern & Responsive UI**:
    -   A sleek, dark theme for comfortable viewing.
    -   "Glassmorphism" effect on content containers for a polished look.
    -   Fully responsive design that works on various screen sizes.
-   **Interactive Sidebar**:
    -   Easily toggle the sidebar for quick navigation to different categories.
    -   Access file upload and download functionalities directly from the sidebar.
-   **Customizable Background**: Cycle through multiple background images to personalize your experience.
-   **Full CRUD Functionality**:
    -   **Add Entries**: Add new manga or comics to any category on the fly.
    -   **Edit Entries**: Click directly on a name or chapter number in the table to edit it. The app supports decimal chapter numbers (e.g., 10.5).
    -   **Delete Entries**: Remove entries with a single click.
-   **Data Export**: Download your entire, up-to-date list as a formatted `.txt` or `.pdf` file.
-   **Total Count Display**: Keep track of the total number of entries in your collection.

## How to Use

1.  **Open `index.html`**: Launch the application by opening the `index.html` file in your web browser.
2.  **Upload a File**:
    -   On the main screen, click the "Upload" button to select a `.txt` or `.pdf` file from your device.
    -   Alternatively, use the upload option in the sidebar.
    -   The file should contain categories (e.g., `Manga`, `Manhwa`) followed by entries on new lines, like `[The Beginning After The End Ch 175.5]`.
3.  **Manage Your List**:
    -   **View**: Scroll through the categorized tables or use the sidebar links to jump to a specific category.
    -   **Edit**: Click on any entry's name or chapter to modify it. The changes are saved automatically when you click away.
    -   **Add**: Hover over a category title and click the `+` button to add a new entry row. Fill in the details and click "Save".
    -   **Delete**: Click the "Delete" button on any row to remove the entry.
4.  **Download Your List**: Use the "Download TXT" or "Download PDF" buttons in the sidebar to save your updated list.
5.  **Toggle Background**: Click the background toggle button in the top-right to cycle through different background images.

## File Structure

```
/
|-- index.html          # The main HTML file
|-- style.css           # All custom CSS styles
|-- script.js           # All JavaScript logic
|-- README.md           # This file
|-- /Background/
|   |-- bg1.jpeg
|   |-- bg2.jpeg
|   |-- bg3.jpeg        # Background images
```

## Technologies Used

-   **HTML5**
-   **CSS3** (with TailwindCSS for utility classes)
-   **JavaScript (ES6+)**
-   **PDF.js**: For parsing `.pdf` files.
-   **jsPDF**: For generating `.pdf` files for download.
