## Frontend Architecture

**Technology**
- React
- CSS

**Responsibilities**
- User authentication 
- Patient dashboard and health passbook UI
- Doctor profile discovery
- Appointment booking flows
- OCR upload interface (future enhancement)
- GPS-based hospital discovery (future enhancement)

---

## Backend Architecture

**Technology**
- Node.js
- Express.js, Prisma
- JWT, bcrypt based authentication 

**Core Modules**
- Auth Service (login, registration, JWT handling)
- Patient Service (profile, health passbook, prescriptions)
- Doctor Service (profiles, availability, appointments)
- Appointment Service (booking, scheduling, reminders)
- OCR Service (planned – prescription scanning)
- Location Service (planned – hospital GPS lookup)

Each module follows:
- Controller → Service → Data Access pattern
- Centralized error handling
- Request validation middleware

---

## Database Architecture

**Primary Database**
- MySQL (structured medical and appointment data)

**Optional / Future**
- MongoDB (unstructured OCR outputs, logs)

**Core Entities**
- Users (Patients)
- Doctors
- Appointments
- Prescriptions
- Medical Records

**Design Considerations**
- Normalized schema
- Referential integrity
- Secure storage of sensitive data

---

## Authentication & Security

- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control (Patient / Doctor)
- Input validation and sanitization

---

## OCR & External Integrations (Planned)

- OCR using cloud-based or open-source OCR engines
- GPS integration using third-party location APIs
- Modular adapters for easy replacement of external services

---