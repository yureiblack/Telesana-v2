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
- **Patient-centric ownership of medical data**
- **Clear separation between health history and health summary**
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

**Key Relationships:**
- One-to-one with `UserProfile`
- One-to-one with `Patient` (if role = PATIENT)
- One-to-one with `Doctor` (if role = DOCTOR)
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
- Ownership of health records (medical history)
- Ownership of a single health summary
- Participation in appointments

**Key Relationships:**
- One-to-one with `User`
- One-to-many with `HealthRecord`
- One-to-one with `HealthSummary`
- One-to-many with `Appointment`

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
- Stores hospital identity and address
- Optionally stores GPS coordinates for future location-based features

**Key Attributes:**
- Name
- Address
- Latitude (optional)
- Longitude (optional)

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
- Many-to-one with `Patient`
- Many-to-one with `Doctor`

---

### 7. HealthRecord (Health Passbook Entries)
**Purpose:**  
Represents **individual medical events** in a patient’s health history.

**Examples:**
- Doctor visit notes
- Lab results
- Prescriptions (manual or OCR-assisted)
- General medical notes

**Design Rationale:**  
Health records are **append-only historical entries** and represent a chronological medical timeline.

**Key Characteristics:**
- Multiple records per patient
- Created by either a doctor or a patient
- Never overwritten

**Key Relationships:**
- Many-to-one with `Patient`

---

### 8. HealthSummary
**Purpose:**  
Represents the **current medical snapshot** of a patient.

**Examples:**
- Blood group
- Allergies
- Chronic diseases
- Ongoing medications
- Height and weight
- Important medical notes

**Design Rationale:**  
Unlike `HealthRecord`, the health summary:
- Is **single per patient**
- Is **continuously updated**
- Acts as a **quick-reference medical overview**

**Key Characteristics:**
- One-to-one with `Patient`
- Automatically tracks last update time (`updatedAt`)
- Editable by doctors (and optionally patients)

**Key Relationships:**
- One-to-one with `Patient`

---

### 9. Reminder
**Purpose:**  
Stores **time-based notifications** for users.

**Examples:**
- Appointment reminders
- Medicine reminders

**Design Rationale:**  
Reminders are linked to `User` rather than roles because **both patients and doctors receive reminders**.

**Key Relationships:**
- Many-to-one with `User`

---

## Referential Integrity & Deletion Strategy

- Cascading deletes are used to maintain data integrity
- Deleting a `User` automatically deletes:
  - UserProfile
  - Patient or Doctor record
  - HealthRecords and HealthSummary (if patient)
  - Appointments
  - Reminders

This ensures **no orphaned medical or operational data** remains.

---

## Summary

The TeleSana database design:
- Clearly separates **authentication**, **medical history**, and **medical summary**
- Models healthcare data realistically
- Is optimized for rapid development under tight timelines
- Supports future extensibility (admin role, labs, OCR pipelines, multiple hospitals)

This architecture balances **real-world healthcare modeling** with **development simplicity**, making it suitable for both academic evaluation and portfolio presentation.

