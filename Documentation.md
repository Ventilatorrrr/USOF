# USOF Project Documentation

## Overview

This full‑fledged documentation describes the implementation progress, architectural decisions, and the overall system algorithm for the **USOF — Ukrainian Stack Overflow** project. 

---

## CBL Progress Documentation

### 1) Engage Stage

**Goal:** Understand the task, define core objectives, research similar solutions.

**Completed Actions:**
- Studied requirements for Q&A platforms and user interaction models.
- Identified minimal core functionality: authentication, posts, comments, likes.
- Selected technologies that satisfy performance and scalability requirements.
- Researched security threats relevant to web apps (injections, brute‑force attacks, XSS, CSRF).
- Defined project scope and roadmap for further implementation.

**Output:** System requirements and high‑level architecture.

---

### 2) Investigate Stage

**Goal:** Analyse tasks, distribute functionality and define API structure.

**Completed Actions:**
- Designed relational database using MySQL and created ER‑diagram.
- Developed REST API specification for all entities: Users, Posts, Categories, Comments, Likes, Reports.
- Studied and selected:
  - React + Redux Toolkit for state management
  - Pagination strategies
  - Authentication flow using JWT
- Validated data flow between client and server.

**Output:** Database schema, endpoint list, UI wireframes, initial React app structure.

---

### 3) Act: Basic Stage

**Goal:** Implement mandatory functionality of backend and frontend.

**Backend Basic Features:**
- Registration, login, JWT authentication
- CRUD operations for posts, comments, categories
- Likes/dislikes and user rating
- Reports and content moderation
- Role‑based access control

**Frontend Basic Features:**
- User interface for all pages with pagination
- Creating/editing posts and comments
- User profiles and avatar support
- Sorting and filtering content
- State persistence (Redux store + API sync)

**Output:** Complete MVP version of the platform.

---

### 4) Act: Creative Stage

**Goal:** Improve UX and extend functionality beyond minimal requirements.

**Implemented Enhancements:**
- Favorites, subscriptions to authors
- Admin dashboard with advanced moderation
- Polished UI with responsive and modern design
- Additional error messaging and form validation
- More convenient content preview and routing logic

**Output:** Final version suitable for real users.

---

## Program Algorithm Description

### System Architecture

The application follows **client‑server architecture**:  
Frontend ⇄ Backend ⇄ Database

```
React Client → REST API → MySQL DB
```

### High‑Level Algorithm

1. **Initialization**
   - Frontend loads environment‑specific API URL
   - Backend connects to MySQL and initializes tables (if required)

2. **Authentication**
   - User logs in → server validates credentials → JWT created
   - Token sent in Authorization headers for protected actions

3. **Content Flow**
   - Posts are requested through paginated API
   - Sorting and category filtering modify query parameters
   - Comments are nested and displayed under posts
   - User interactions (likes, favorites, reports) update DB and UI

4. **Moderation Logic**
   - Reports counted for each post/comment
   - On threshold: content becomes inactive (hidden from users)
   - Admin may force activation/deactivation

5. **Admin Role Access**
   - Verified by decoding JWT and permission check middleware
   - Admin pages allow CRUD on users, categories, reports

6. **Error Handling**
   - Centralized backend middleware: validation + error responses
   - Frontend: toast messages and UI state updates

### Data Lifecycle Example (Post → Comment → Like)

```
User action → Redux dispatch → API call → DB update
                                    ↓
                            New state returned
                                    ↓
                    Redux store update → UI rerender
```

---

## Implementation Notes

- Code follows best practices for modern JavaScript/React development.
- API tested manually using Postman, frontend tested through UI.
- App prepared for scaling: pagination, modular components, role‑based routes.

---

## Conclusion

The USOF project demonstrates practical skills in:  
✔ Full‑stack development  
✔ Database modeling  
✔ Asynchronous client‑server communication  
✔ Secure authentication and role‑based flows  
✔ UI/UX implementation with responsive design  

This documentation provides the necessary overview for collaboration, debugging, and further upgrades.

---

## Author

**Kateryna Lytovchenko**  
NTU "KhPI" Innovation Campus
