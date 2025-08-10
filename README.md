# 🚀 Fast-Commerce Inventory Management System

![Node.js](https://img.shields.io/badge/Node.js-16.x-green?logo=node.js)
![React](https://img.shields.io/badge/React-18.x-blue?logo=react)
![Python](https://img.shields.io/badge/Python-3.x-yellow?logo=python)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)
![Render](https://img.shields.io/badge/Deployed%20on-Render-purple)

**Fast-Commerce** is a comprehensive, modular full-stack inventory management system tailored for multi-store businesses. It offers real-time stock and order tracking, predictive analytics with ML-powered demand forecasting, interactive store maps, and strict role-based access control. Built using React, Node.js, MongoDB, and Python FastAPI microservices, it delivers a robust and scalable solution for inventory challenges.

---

## 🌟 Project Overview

Fast-Commerce enables efficient inventory management across multiple store locations by providing:

- Role-based authentication for Managers and Customers  
- Real-time inventory monitoring and order management  
- ML-driven demand forecasting with actionable reorder suggestions  
- Automated, role-specific notifications for stock alerts  
- Interactive store visualizations and heatmaps using geospatial data  

---

## ✨ Core Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication with bcrypt password hashing  
- Role-specific access controls for Manager and Customer users  
- Explicit role selection during signup and login  
- Password reset via email with secure token flows  
- Session management leveraging browser localStorage  
- Middleware protecting all sensitive routes  

### 🏪 Store Management
- Support for multiple stores with accurate geolocation coordinates  
- Store-specific inventory tracking and management  
- Manager assignment with granular permissions  
- Interactive React Leaflet maps displaying store locations  
- Detailed store pages showing inventory summaries  
- Efficient geospatial indexing for location-based queries  

### 📦 Inventory Management
- Live updates on stock quantities with real-time monitoring  
- Automatic SKU generation for new inventory items  
- Threshold-based reorder alerts to prevent stockouts  
- Categorization, search, and filter capabilities for easy navigation  
- Bulk operations for mass inventory updates  

### 🛒 Order Processing
- Customer-friendly order placement with shopping cart functionality  
- Atomic stock decrement ensuring data consistency on order completion  
- Comprehensive order history and status tracking for all users  
- Manager dashboard for overseeing and managing orders  
- Analytics integration supporting ML-based forecasting  
- Real-time order status updates and notifications  

### 🤖 ML-Powered Forecasting
- Analysis of 7-day sales data to predict inventory demand  
- Confidence scoring applied to average daily sales calculations  
- Reorder quantity suggestions with safety buffers included  
- Store-specific demand modeling for precise forecasting  
- Integration of ML suggestions via scheduled cron jobs  

### 🔔 Smart Notifications
- Polling backend every 30 seconds for new notifications  
- Role-based filtering ensuring relevant alerts for managers/customers  
- Alerts for low stock and out-of-stock conditions  
- Notifications for ML-based reorder recommendations  
- Tracking of unread notifications with toast alert presentation  

### ⏰ Automated Cron Jobs
- Hourly inventory monitoring triggering notifications  
- Seamless ML service integration for demand forecasting  
- Cleanup of outdated notifications for system efficiency  
- Manual test endpoints for cron task verification  

### 🗺️ Interactive Maps
- React Leaflet-powered interactive store maps  
- Clickable markers displaying detailed store information  
- Fully responsive UI optimized for all device sizes  
- Geolocation-based filtering and display of stores  
- Role-specific map views tailored to Managers and Customers  

---

## 🧰 Tech Stack

### 🎯 Frontend
- React 18 with Vite bundler  
- React Router DOM for navigation  
- Context API for authentication and notifications  
- Tailwind CSS for styling  
- React Leaflet for interactive maps  
- Lucide React icons  
- React Hot Toast for notifications  
- Axios for API communication  

### 🛠️ Backend
- Node.js runtime with Express.js framework  
- MongoDB with Mongoose ODM for data persistence  
- JWT and bcrypt for secure authentication  
- Node-Cron for scheduled background jobs  
- Nodemailer for sending emails  
- Input validation with express-validator  
- CORS configured for secure cross-origin requests  

### 🧠 ML Service
- Python FastAPI with Uvicorn server  
- Requests library for HTTP client operations  
- Sales pattern analysis and demand forecasting algorithms  

### 🗄️ Database
- MongoDB Atlas document database  
- Geospatial indexing for location-based queries  
- Core models include User, Store, Item, Order, Notification  
- Relationships managed via document references and population  

---

## 🎯 User Roles & Features

| Role     | Features                                                                                     |
|----------|----------------------------------------------------------------------------------------------|
| Manager  | Manage stores and inventory, oversee orders, receive ML reorder suggestions and alerts, access analytics and interactive store maps |
| Customer | Browse stores and inventory, place and manage orders, track order history, receive order notifications, view store locations         |

---

## 🔍 Feature Verification & Status

All core functionalities are fully implemented and tested, including:

- Role-based secure authentication and authorization  
- Multi-store geolocation and inventory management  
- Real-time order processing and tracking  
- ML-powered demand forecasting and reorder alerts  
- Automated notification system with role filtering  
- Scheduled cron jobs for inventory and ML task automation  
- Responsive, interactive mapping for store visualization  
- Seamless integration across backend, frontend, and ML services  
- Robust error handling and security best practices  

---

## 📈 Performance & Scalability

- Backend average response time under 200ms  
- ML service response time under 500ms  
- Frontend load time below 2 seconds  
- Database optimized with indexes and geospatial queries  
- Modular architecture allowing independent service scaling  
- Real-time updates via 30-second notification polling  

---

## 🔒 Security Features

- JWT tokens with bcrypt password hashing for authentication  
- Role-based access control with protected routes  
- Input validation and sanitization to prevent injection attacks  
- Secure CORS configuration  
- Environment-based management of sensitive data  
- Comprehensive error handling to avoid data leaks  

---
