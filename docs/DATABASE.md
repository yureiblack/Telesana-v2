# Database Design – TeleSana

## Overview

TeleSana uses a **relational database design** built with **MySQL and Prisma ORM**.  
The schema follows a **role-based healthcare model** supporting both **patients and doctors**, with a strong focus on medical correctness, reminder accuracy, and extensibility.

The system supports two user roles:
- **Patient**
- **Doctor**

There is **no admin role** in this version.

---

## Core Design Principles

- **Single User entity** for authentication & authorization
- **Role-specific extensions** using `Patient` and `Doctor`
- **Patient-centric ownership** of medical data
- **Clear separation** between:
  - Medical history (HealthRecord)
  - Current snapshot (HealthSummary)
- **Normalized medicine & reminder scheduling**
- **Explicit bidirectional relations** (Prisma-safe)
- **Strong referential integrity** with cascading deletes

---

## Enums

### UserRole
Defines the role of a user.
- `PATIENT`
- `DOCTOR`

---

### AppointmentStatus
Tracks appointment lifecycle.
- `SCHEDULED`
- `COMPLETED`
- `CANCELLED`

---

### ReminderType
Defines reminder intent.
- `APPOINTMENT`
- `MEDICINE`

---

### HealthRecordType
Defines the type of medical record.
- `VISIT`
- `LAB`
- `PRESCRIPTION`
- `NOTE`

---

### Gender
User gender (inclusive).
- `MALE`
- `FEMALE`
- `OTHER`
- `PREFER_NOT_TO_SAY`

---

### BloodGroup
Patient blood group.
- `A_POS`, `A_NEG`
- `B_POS`, `B_NEG`
- `AB_POS`, `AB_NEG`
- `O_POS`, `O_NEG`

---

### DayPeriod
Defines medicine intake periods.
- `MORNING`
- `EVENING`
- `NIGHT`

---

## Entity Descriptions & Relationships

---

### 1. User
**Purpose:**  
Represents the **authentication identity** of every system user.

**Responsibilities:**
- Login & authentication
- Role identification
- Reminder ownership

**Key Relationships:**
- One-to-one with `UserProfile`
- One-to-one with `Patient` (if role = PATIENT)
- One-to-one with `Doctor` (if role = DOCTOR)
- One-to-many with `Reminder`

---

### 2. UserProfile
**Purpose:**  
Stores **personal information** shared across all roles.

**Design Note:**  
Optional to support **progressive onboarding**.

**Key Relationships:**
- One-to-one with `User` (cascade delete)

---

### 3. Patient
**Purpose:**  
Represents the **medical identity** of a patient.

**Responsibilities:**
- Owns medical history and summary
- Receives prescriptions
- Participates in appointments
- Owns medicine schedule slots

**Key Relationships:**
- One-to-one with `User`
- One-to-many with `HealthRecord`
- One-to-one with `HealthSummary`
- One-to-many with `Appointment`
- One-to-many with `Prescription`
- One-to-many with `MedicineScheduleSlot`

---

### 4. Doctor
**Purpose:**  
Represents the **professional identity** of a doctor.

**Responsibilities:**
- Issues prescriptions
- Conducts appointments
- Works at a hospital

**Key Relationships:**
- One-to-one with `User`
- Many-to-one with `Hospital`
- One-to-many with `Appointment`
- One-to-many with `Prescription`

---

### 5. Hospital
**Purpose:**  
Represents a healthcare facility.

**Responsibilities:**
- Stores hospital identity and location

**Key Relationships:**
- One-to-many with `Doctor`

---

### 6. Appointment
**Purpose:**  
Represents a consultation between a patient and a doctor.

**Responsibilities:**
- Tracks appointment timing
- Tracks status
- Acts as a source for appointment reminders

**Key Relationships:**
- Many-to-one with `Patient`
- Many-to-one with `Doctor`
- One-to-many with `Reminder`

---

### 7. Reminder
**Purpose:**  
Stores **time-based notifications**.

**Examples:**
- Appointment reminders (e.g., 1 hour before)
- Medicine reminders (based on patient-defined time)

**Design Rationale:**
A unified reminder system for all reminder types.

**Key Relationships:**
- Many-to-one with `User`
- Optional many-to-one with `Appointment`
- Optional many-to-one with `MedicineScheduleSlot`

---

### 8. HealthRecord (Health Passbook)
**Purpose:**  
Represents **historical medical events**.

**Examples:**
- Doctor visits
- Lab reports
- Prescription records
- Notes

**Design Rationale:**
- Append-only
- Chronological medical timeline
- Never overwritten

**Key Relationships:**
- Many-to-one with `Patient`

---

### 9. HealthSummary
**Purpose:**  
Represents the **current medical snapshot** of a patient.

**Examples:**
- Blood group
- Allergies
- Chronic conditions
- Ongoing medications
- Height & weight

**Design Rationale:**
- Exactly one per patient
- Continuously updated
- Quick-reference medical overview

**Key Relationships:**
- One-to-one with `Patient`

---

### 10. Prescription
**Purpose:**  
Represents a doctor-issued prescription.

**Responsibilities:**
- Groups prescribed medicines
- Serves as a medical record

**Key Relationships:**
- Many-to-one with `Patient`
- Many-to-one with `Doctor`
- One-to-many with `Medicine`

---

### 11. Medicine
**Purpose:**  
Represents a single medicine in a prescription.

**Responsibilities:**
- Stores medicine name & dosage
- Defines intake periods

**Key Relationships:**
- Many-to-one with `Prescription`
- One-to-many with `MedicineSchedule`

---

### 12. MedicineSchedule
**Purpose:**  
Defines **when** a medicine should be taken (period-based).

**Examples:**
- Morning
- Evening
- Night

**Design Rationale:**
Doctor-defined intake periods.

**Key Relationships:**
- Many-to-one with `Medicine`
- One-to-many with `MedicineScheduleSlot`

---

### 13. MedicineScheduleSlot
**Purpose:**  
Represents the **exact time** a patient chooses to take medicine.

**Examples:**
- Morning → 10:00 AM
- Evening → 5:00 PM
- Night → 10:00 PM

**Design Rationale:**
- Patient-controlled timing
- Multiple medicines can map to the same slot
- Drives medicine reminders

**Key Relationships:**
- Many-to-one with `Patient`
- Many-to-one with `MedicineSchedule`
- One-to-many with `Reminder`

---

## Referential Integrity & Deletion Strategy

- Cascading deletes ensure **no orphaned data**
- Deleting a `User` deletes:
  - UserProfile
  - Patient or Doctor
    - If Patient, also deletes:
      - HealthRecord (medical history)
      - HealthSummary (current snapshot)
      - Appointments
      - Prescriptions
      - MedicineScheduleSlot & associated MedicineSchedule references
      - Reminders
    - If Doctor, also deletes:
      - Appointments
      - Prescriptions
      - Reminders

This guarantees **data consistency and safety**.

---

## Summary

The TeleSana database design:
- Accurately models real-world healthcare workflows
- Supports precise appointment and medicine reminders
- Separates historical vs current medical data
- Is scalable, explicit, and Prisma-safe
- Suitable for academic evaluation and production-ready demos

This schema balances **medical correctness**, **developer clarity**, and **future extensibility**, making it a strong foundation for TeleSana.