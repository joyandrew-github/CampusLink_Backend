CampusLink Backend
CampusLink Backend is the server-side component of the Campus Link platform, a web-based application designed to enhance campus life by providing tools for students and administrators to manage hostel complaints, lost and found items, timetables, polls, and a skill exchange marketplace. This repository contains the RESTful API built with Node.js, Express, and MongoDB, supporting role-based authentication and integration with an AI model for complaint categorization.


Table of Contents


Features
Tech Stack
Installation
Environment Variables
Running the Server
API Endpoints
Contributing
License

Features
The backend supports the following features of the Campus Link platform:

Hostel Complaints

Create, read, update, and delete (CRUD) complaints for students.
Admins can view and manage all complaints, updating statuses (e.g., pending, resolved).
AI-driven categorization of complaints using an external AI model.


Lost & Found

CRUD operations for reporting and managing lost or found items.
Support for filtering by category, status, or date.


Timetable Management

CRUD operations for student timetables, storing class schedules with details like subject, professor, and room.


Polls & Feedback

Admins can create and close polls.
Students can vote and view poll results.
Supports event-specific feedback collection.


Skill Exchange Marketplace

Students can create and manage skill listings (e.g., coding, design).
Booking system for peer-to-peer learning sessions with availability slots.
Role-based access to prevent self-booking.


Authentication & Authorization

JWT-based authentication for secure user login.
Role-based access control (students vs. admins).



Tech Stack

Node.js: JavaScript runtime for server-side logic.
Express.js: Web framework for building RESTful APIs.
MongoDB: NoSQL database for storing user data, complaints, polls, skills, etc.
Mongoose: ODM for MongoDB schema management.
Axios: For HTTP requests to the AI model for complaint categorization.
jsonwebtoken: For JWT-based authentication.
express-async-handler: For simplified async error handling.
dotenv: For managing environment variables.

Installation
Prerequisites

Node.js (v16 or higher)
MongoDB (local or cloud instance, e.g., MongoDB Atlas)
Git

Steps

Clone the Repository
git clone https://github.com/joyandrew-github/CampusLink_Backend.git
cd CampusLink_Backend


Install Dependencies
npm install


Set Up Environment VariablesCreate a .env file in the root directory with the following:
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
AI_MODEL_URL=your-ai-model-endpoint
PORT=5000


MONGO_URI: MongoDB connection string (e.g., mongodb://localhost:27017/campuslink or MongoDB Atlas URL).
JWT_SECRET: A secure string for signing JWT tokens.
AI_MODEL_URL: Endpoint for the AI model used for complaint categorization (if applicable).
PORT: Port for the server (default: 5000).



Running the Server

Start the Development Server
npm run dev

This uses nodemon to automatically restart the server on code changes.

Start the Production Server
npm start


Access the APIThe server runs at http://localhost:5000. Use tools like Postman or cURL to test API endpoints.


API Endpoints
The API is organized by feature, with role-based access enforced via JWT authentication. Below is a summary of key endpoints. All requests (except POST /api/users/register and POST /api/users/login) require a Bearer token in the Authorization header.
Authentication

POST /api/users/register
Register a new user (student or admin).
Body: { "name": string, "email": string, "password": string, "role": "student" | "admin" }


POST /api/users/login
Log in and receive a JWT token.
Body: { "email": string, "password": string }



Hostel Complaints

POST /api/complaints
Create a complaint (students only).
Body: { "title": string, "description": string }


GET /api/complaints
Get all complaints (students: own, admins: all).


GET /api/complaints/:id
Get a specific complaint.


PUT /api/complaints/:id
Update a complaint (students: own, admins: all).
Body: { "title"?: string, "description"?: string, "status"?: string }


DELETE /api/complaints/:id
Delete a complaint (students: own, admins: all).



Lost & Found

POST /api/lostfound
Create a lost/found item report.
Body: { "title": string, "description": string, "category": string, "status": "lost" | "found" }


GET /api/lostfound
Get all lost/found items.


PUT /api/lostfound/:id
Update an item (owner only).


DELETE /api/lostfound/:id
Delete an item (owner only).



Timetable

POST /api/timetable
Add a timetable entry.
Body: { "day": string, "startTime": string, "endTime": string, "subject": string, "professor": string, "room": string }


GET /api/timetable
Get the user’s timetable.


PUT /api/timetable/:id
Update a timetable entry.


DELETE /api/timetable/:id
Delete a timetable entry.



Polls

POST /api/polls
Create a poll (admins only).
Body: { "title": string, "question": string, "options": string[], "targetAudience"?: string, "closesAt"?: string }


POST /api/polls/:id/vote
Vote on a poll (students only).
Body: { "optionIndex": number }


GET /api/polls
Get all polls (students: accessible, admins: all).


PUT /api/polls/:id/close
Close a poll (admins only).



Skill Exchange

POST /api/skills
Create a skill listing (students only).
Body: { "title": string, "description": string, "category": string, "otherCategory"?: string, "duration": number, "availability": [{ "date": string, "startTime": string, "endTime": string }] }


POST /api/skills/:id/book
Book a session (students only).
Body: { "slotIndex": number }


GET /api/skills
Get all active skill listings.


GET /api/skills/:id
Get a specific skill listing.


PUT /api/skills/:id
Update a skill listing (instructor only).


DELETE /api/skills/:id
Delete a skill listing (instructor only).



Contributing
Contributions are welcome! To contribute:

Fork the repository.
Create a new branch (git checkout -b feature/your-feature).
Make your changes and commit (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Create a pull request.

Please ensure your code follows the project’s coding standards (e.g., ESLint rules) and includes relevant tests.
Development Guidelines

Use consistent error handling with express-async-handler.
Validate inputs using Mongoose schemas and custom middleware.
Follow RESTful API conventions.
Document new endpoints in this README.

License
This project is licensed under the MIT License. See the LICENSE file for details.
