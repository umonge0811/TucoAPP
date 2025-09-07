# Tuco - Tire Management System

## Overview

Tuco is a comprehensive tire and automotive parts management system designed for tire shops and automotive service businesses. The application consists of a separate API backend and web frontend, providing inventory management, user authentication, permissions system, and business operations management. The system handles product catalogs, inventory tracking, user roles, and business workflow automation for tire retail operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: ASP.NET Core 7.0 Web API
- **Authentication**: JWT-based authentication with configurable expiry times
- **Authorization**: Role-based access control with granular permissions system
- **Data Access**: Entity Framework Core for database operations
- **Email Services**: SMTP email integration for notifications and communications
- **Cross-Origin Requests**: CORS enabled for frontend-backend communication

### Frontend Architecture
- **Framework**: ASP.NET Core 7.0 MVC web application
- **Authentication**: Cookie-based authentication integrated with API JWT tokens
- **UI Components**: Server-side rendered views with JavaScript enhancements
- **Permission Management**: Custom TagHelpers for role-based UI rendering
- **API Integration**: HTTP client services for backend communication

### Data Storage Architecture
- **Primary Database**: Microsoft SQL Server
- **Development Database**: Local SQL Server Express instance
- **Production Database**: Hosted SQL Server (somee.com)
- **Connection Management**: Separate connection strings for development and production environments

### Permission and Authorization System
- **Role-Based Access Control**: Hierarchical role system with administrative roles
- **Granular Permissions**: Function-level permissions for specific operations
- **Critical Permissions**: Special handling for high-privilege operations
- **Caching**: Memory caching for permission data with configurable expiration
- **Development Overrides**: Special permissions handling in development environment

### Configuration Management
- **Environment-Specific Settings**: Separate appsettings files for development and production
- **Security Configuration**: JWT keys, database credentials, and email settings
- **Feature Flags**: Configurable logging levels and permission system toggles
- **Base URL Configuration**: Environment-specific API and web application URLs

## External Dependencies

### Database Services
- **Microsoft SQL Server**: Primary data storage for both development and production
- **Entity Framework Core**: ORM for database operations and migrations
- **SQL Server Express**: Local development database instance

### Email Services
- **SMTP Server**: mail.ticodevcr.com for email communications
- **Email Configuration**: SSL-enabled email sending with authentication
- **Notification System**: Automated email notifications for business processes

### Hosting and Deployment
- **Production API**: Hosted at apillantasymast.somee.com
- **Production Web**: Hosted at llantasymastc.com
- **Development Environment**: Local IIS Express with hot reload capabilities
- **Domain Services**: ticodevcr.com domain management

### Authentication and Security
- **JWT Token Management**: Secure token-based API authentication
- **SSL/TLS**: HTTPS enforcement for secure communications
- **Password Security**: Encrypted password storage and validation
- **CORS Policy**: Cross-origin request handling for API access

### Development Tools
- **Visual Studio Integration**: Hot reload and debugging capabilities
- **Browser Link**: Development-time browser synchronization
- **API Discovery**: Automatic endpoint discovery for development tools
- **Logging**: Structured logging with configurable levels for different environments