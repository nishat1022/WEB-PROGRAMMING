# WEB PROGRAMMING PROJECT

## Overview

This repository contains the web programming assignments for document management.  
It includes **Assignment 1 (frontend only)** and **Assignment 2 (frontend + backend CRUD integration)**.

---

## Folder Structure

### Assignment 1
ASSIGNMENT1 UPDATED VERSION/
├── css/ # CSS files
├── js/ # JavaScript frontend logic
├── news-site/ # Additional HTML pages
├── news.html
├── newsEdit.html
└── Web Asg1 Explanation.pdf

### Assignment 2 (Backend CRUD)
ASSIGNMENT2 (BACKEND UPDATED)/
├── css/ # Same as Assignment 1
├── js/ # JS updated to call backend API
├── php/ # Backend API
│ ├── api.php
│ └── config.php
├── database.sql # SQL script to create database & table
├── news.html
├── newsEdit.html
├── index.html
├── about.html
├── contact.html
├── publications.html
├── research.html
└── teaching.html

---

## Setup Instructions

1. **Copy folder to local server**

   Place the Assignment 2 folder inside your local server root:

   - **XAMPP:** `C:\xampp\htdocs\ASSIGNMENT2_BACKEND_UPDATED`
   - **Laragon:** `C:\laragon\www\ASSIGNMENT2_BACKEND_UPDATED`

2. **Start server**

   - Apache → Start
   - MySQL → Start

3. **Create database**

   - Open phpMyAdmin: `http://localhost/phpmyadmin`
   - Import `database.sql` file or run its SQL code
   - Database created: `news_editor`
   - Table created: `documents` (columns: `id, title, content, category, display_date, word_count, created_at, updated_at`)

4. **Open the website**

   - `http://localhost/ASSIGNMENT2_BACKEND_UPDATED/newsEdit.html`
   - `http://localhost/ASSIGNMENT2_BACKEND_UPDATED/news.html` for list view

5. **Test CRUD functionality**

   - **Create**: Click “New Document”, enter title/content, Save
   - **Read**: Document appears in list
   - **Update**: Click a document → edit → Save
   - **Delete**: Delete a document from the list

---

## Notes

- **API endpoint:** `php/api.php`  
- **Database config:** `php/config.php`  
- All frontend JS files are updated to fetch data from the backend instead of using localStorage.  
- Screenshots of CRUD operations are included in `CRUD Screenshots/` folder.

---


## Important

- Make sure your server is running before opening the website.  
- If you get `Invalid Date` or `0 words`, make sure database table matches `documents` structure and API is returning JSON.
