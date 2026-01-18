# Database Design – TeleSana

## Overview

TeleSana uses a **relational database design** built with **MySQL and Prisma ORM**.  
The database follows a **role-based user model** and separates authentication, healthcare domain data, and operational data to ensure clarity, scalability, and correctness.

The system supports two user roles:
- **Patient**
- **Doctor**

There is **no admin role** for simplicity in this version.

---

## Database Architecture

### Core Design Principles
- **Single User entity** for authentication and authorization
- **Role-specific extensions** using Patient and Doctor tables
- **Patient-centric health data ownership**
- **Normalized schema** to avoid duplication
- **Strong referential integrity** using foreign keys and cascading deletes

---

## Enums

### UserRole
Defines the role of a user in the system.
- `PATIENT`
- `DOCTOR`

---

### AppointmentStatus
Tracks the lifecycle of an appointment.
- `SCHEDULED`
- `COMPLETED`
- `CANCELLED`

---

### ReminderType
Defines the purpose of a reminder.
- `APPOINTMENT`
- `MEDICINE`

---

## Entity Descriptions & Relationships

---

### 1. User
**Purpose:**  
Represents the **authentication identity** of every person using TeleSana.

**Responsibilities:**
- Login and authentication
- Role identification (Patient or Doctor)
- Ownership of reminders
- Participation in appointments

**Key Relationships:**
- One-to-one with `UserProfile`
- One-to-one with `Patient` (if role = PATIENT)
- One-to-one with `Doctor` (if role = DOCTOR)
- One-to-many with `Appointment` (as patient or doctor)
- One-to-many with `Reminder`

---

### 2. UserProfile
**Purpose:**  
Stores **personal information** shared across all user roles.

**Design Note:**  
This entity is optional to support **progressive onboarding**, allowing users to complete their profile after account creation.

**Key Relationships:**
- One-to-one with `User` (cascade delete)

---

### 3. Patient
**Purpose:**  
Represents the **medical identity** of a user acting as a patient.

**Responsibilities:**
- Ownership of health records
- Patient-specific healthcare data

**Key Relationships:**
- One-to-one with `User`
- One-to-many with `HealthRecord`

---

### 4. Doctor
**Purpose:**  
Represents the **professional identity** of a user acting as a doctor.

**Responsibilities:**
- Providing consultations
- Participating in appointments
- Being associated with a hospital

**Key Attributes:**
- Specialization
- Experience
- License number (unique, mandatory)

**Key Relationships:**
- One-to-one with `User`
- Many-to-one with `Hospital`
- One-to-many with `Appointment`

**Design Constraint:**  
Each doctor works at **exactly one hospital**.

---

### 5. Hospital
**Purpose:**  
Represents a physical healthcare facility.

**Responsibilities:**
- Stores hospital location data
- Acts as a workplace for doctors

**Key Attributes:**
- Name
- Address
- GPS coordinates (latitude, longitude)

**Key Relationships:**
- One-to-many with `Doctor`

---

### 6. Appointment
**Purpose:**  
Represents a scheduled consultation between a patient and a doctor.

**Responsibilities:**
- Tracks appointment timing
- Tracks appointment status

**Key Relationships:**
- Many-to-one with `User` (patient)
- Many-to-one with `User` (doctor)

---

### 7. HealthRecord (Health Passbook Entry)
**Purpose:**  
Represents an individual medical event in a patient’s health history.

**Examples:**
- Doctor consultation summary
- Diagnosis
- Test result
- OCR-extracted prescription

**Design Rationale:**  
Health records are linked directly to `Patient` because **only patients own medical histories**.

**Key Relationships:**
- Many-to-one with `Patient`

---

### 8. Reminder
**Purpose:**  
Stores **time-based notifications** for users.

**Examples:**
- Appointment reminders
- Medicine reminders

**Design Rationale:**  
Reminders are linked to `User` instead of roles because **both patients and doctors receive notifications**.

**Key Relationships:**
- Many-to-one with `User`

---

## Referential Integrity & Deletion Strategy

- Cascading deletes are used where child entities should not exist without their parent
- Deleting a `User` automatically deletes:
  - UserProfile
  - Patient or Doctor record
  - Health records (if patient)
  - Reminders

This ensures **no orphaned records** remain in the database.

---

## Summary

The TeleSana database design:
- Separates authentication from domain logic
- Models healthcare data accurately
- Is optimized for a single-database backend
- Supports future extensibility (admin role, multiple hospitals, labs)

This architecture balances **real-world correctness** with **development simplicity**, making it suitable for both academic evaluation and portfolio presentation.
