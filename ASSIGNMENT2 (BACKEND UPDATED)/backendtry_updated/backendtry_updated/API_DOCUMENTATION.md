Assignment 2: Backend CRUD Implementation

1. Project Overview

This project implements a backend CRUD API for managing news/articles.
The frontend communicates with the backend using JavaScript fetch() calls.
The backend is built using PHP, and the database is managed using MySQL through phpMyAdmin.

The system supports:

Create news
Read news
Update news
Delete news
Display images
Read More / full article view

2. Technology Used

Frontend: HTML, CSS, JavaScript
Backend: PHP
Database: MySQL
Local Server: XAMPP
Database Tool: phpMyAdmin

3. Base URL

For local testing, the API URL is:

http://localhost/backendtry_updated/api.php

In JavaScript, the API is called from:

const API_BASE_URL = 'api.php';

4. Database Information

Database name:

news_editor

Table name:

documents

Main table columns:

id
title
content
details
category
display_date
image_url
created_at
updated_at

The database structure and sample data are provided in:

seed.sql

5. API Endpoints

5.1 Get All News
Method
GET
Endpoint
/api.php
Full URL
http://localhost/backendtry_updated/api.php
Purpose

Retrieves all news/articles from the database.

Example Response
[
  {
    "id": 1,
    "title": "Best Paper Award at HCI International 2024",
    "content": "Received the Best Paper Award...",
    "details": "The paper titled Emotion-Responsive Adaptive Interfaces...",
    "category": "award",
    "displayDate": "2024-07-15",
    "imageUrl": "https://images.unsplash.com/photo-example",
    "createdAt": "2026-06-14 20:23:13",
    "updatedAt": "2026-06-14 20:23:13"
  }
]
5.2 Get Single News by ID
Method
GET
Endpoint
/api.php?id=1
Full URL
http://localhost/backendtry_updated/api.php?id=1
Purpose

Retrieves one specific news/article based on ID.

Example Response
{
  "id": 1,
  "title": "Best Paper Award at HCI International 2024",
  "content": "Received the Best Paper Award...",
  "details": "The paper titled Emotion-Responsive Adaptive Interfaces...",
  "category": "award",
  "displayDate": "2024-07-15",
  "imageUrl": "https://images.unsplash.com/photo-example",
  "createdAt": "2026-06-14 20:23:13",
  "updatedAt": "2026-06-14 20:23:13"
}
5.3 Create News
Method
POST
Endpoint
/api.php
Purpose

Creates a new news/article.

Request Body Example
{
  "title": "Climate Change Action",
  "content": "Climate change is impacting communities across every continent.",
  "details": "More details about climate change action and global response.",
  "category": "research",
  "displayDate": "2026-06-14",
  "imageUrl": "uploads/climate.png"
}
Example Response
{
  "id": 7,
  "title": "Climate Change Action",
  "content": "Climate change is impacting communities across every continent.",
  "details": "More details about climate change action and global response.",
  "category": "research",
  "displayDate": "2026-06-14",
  "imageUrl": "uploads/climate.png",
  "createdAt": "2026-06-14 21:00:00",
  "updatedAt": "2026-06-14 21:00:00"
}
5.4 Update News
Method
PUT
Endpoint
/api.php?id=7
Purpose

Updates an existing news/article by ID.

Request Body Example
{
  "title": "Climate Change Action Updated",
  "content": "Updated summary content.",
  "details": "Updated full article details.",
  "category": "research",
  "displayDate": "2026-06-14",
  "imageUrl": "uploads/climate-updated.png"
}
Example Response
{
  "id": 7,
  "title": "Climate Change Action Updated",
  "content": "Updated summary content.",
  "details": "Updated full article details.",
  "category": "research",
  "displayDate": "2026-06-14",
  "imageUrl": "uploads/climate-updated.png",
  "createdAt": "2026-06-14 21:00:00",
  "updatedAt": "2026-06-14 21:10:00"
}
5.5 Delete News
Method
DELETE
Endpoint
/api.php?id=7
Purpose

Deletes a news/article by ID.

Example Response
{
  "success": true,
  "message": "News deleted successfully"
}
6. Frontend Integration

The frontend uses JavaScript fetch() to communicate with the PHP API.

Example:

fetch('api.php')
  .then(response => response.json())
  .then(data => console.log(data));

CRUD operations are performed through:

GET     → Read news
POST    → Create news
PUT     → Update news
DELETE  → Delete news

7. How to Run the Project

Copy the project folder into XAMPP htdocs:
C:\Study\XAMPP\htdocs\backendtry_updated
Start XAMPP:
Apache → Start
MySQL → Start
Open phpMyAdmin:
http://localhost/phpmyadmin
Import or run seed.sql.
Open the website:
http://localhost/backendtry_updated/newsEdit.html
Open public news page:
http://localhost/backendtry_updated/news.html

8. CRUD Testing Checklist

Create: New news item can be created and saved.
Read: News items are loaded from MySQL database.
Update: Existing news item can be edited and saved.
Delete: News item can be deleted from frontend and database.
Image: Image URL or uploaded image displays correctly.
Read More: Public news page shows article preview and full details.

9. Notes

The API returns data in JSON format.
If PHP or database errors occur, the frontend may fail because it expects JSON response.
The database name in config.php must match the database in phpMyAdmin:

news_editor
