# dental-connect 

**ABOUT THE PROJECT**: 

**Dental Connect** is a single-page Angular application designed to connect dental professionals with patients. It allows dentists to create and manage their profiles and promotions, and enables patients to browse and interact with available services.

**HOW IT WORKS**:

- Install dependencies: **npm install**
- Start Angular frontend: **ng serve**
- Start backend (from project root. The backend runs on http://localhost:3030): **node server.js**

**USED TECHNOLOGIES**:

- Angular 20
- TypeScript
- RxJS
- Angular Signals
- Standalone Components
- Node.js (for mock backend API)
- Custom REST API
- HTML5 & CSS

**PUBLIC AREA**:

- Login and Register forms
- Publicly viewable dentist profiles and promotions
- Home page with navigation and routing

**PRIVATE AREA** (for logged-in users):

Dentist users:
  - Create and edit personal profiles
  - Create and manage promotions
    
Patient users:
  - View dentist promotions
  - “Buy” a promotion (client-side interaction only)

**PROJECT STRUCTURE**:

src/

app/

core/ # Authentication, API services

features/ # Auth, Dentists, Promotions

models/ # TypeScript interfaces

shared/ # Shared components & utilities
