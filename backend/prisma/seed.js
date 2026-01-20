require('dotenv').config()
const {PrismaClient, UserRole, ReminderType, AppointmentStatus, Gender, HealthRecordType, BloodGroup} = require('@prisma/client')
const bcrypt = require("bcrypt")
const prisma = new PrismaClient()

async function seed(){
    console.log("Seeding Demo Data...")

    const existingSeedData = await prisma.user.findFirst({
        where: {isDemo: true}
    })

    if(existingSeedData){
        console.log("Dummy data already exists. Skipping seed.")
        return 
    }

    // Hospitals:
    const hospitals = await prisma.$transaction([
        prisma.hospital.create({
            data: {
                name: "Demo Hospital 1 - Bengaluru",
                address: "MG Road, Bengaluru",
                latitude: 12.9716,
                longitude: 77.5946,
                isDemo: true
            }
        }),
        prisma.hospital.create({
            data: {
                name: "Demo Hospital 2 - Pune",
                address: "Koregaon Park, Pune",
                latitude: 18.5204,
                longitude: 73.8567,
                isDemo: true
            }
        })
    ])

    //Doctors:
    const doctorProfiles = [
    {
      name: "Dr. Ananya Sharma",
      specialization: "General Physician",
      experience: 12,
      hospitalIndex: 0,
    },
    {
      name: "Dr. Rohan Mehta",
      specialization: "Cardiologist",
      experience: 15,
      hospitalIndex: 0,
    },
    {
      name: "Dr. Neha Iyer",
      specialization: "Dermatologist",
      experience: 8,
      hospitalIndex: 1,
    },
    {
      name: "Dr. Arjun Rao",
      specialization: "Orthopedic",
      experience: 10,
      hospitalIndex: 1,
    }]

    const doctors = []

    for (let i=0; i<doctorProfiles.length; i++){
        const d = doctorProfiles[i]

        const user_doctor = await prisma.user.create({
            data: {
                email: `demo.doctor${i + 1}@demo.telesana.com`,
                password: await bcrypt.hash("Demo@1234", 10),
                role: UserRole.DOCTOR,
                isDemo: true,
                profile: {
                    create: {
                        name: d.name,
                        age: 35 + i,
                        gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE
                    }
                }
            }
        })

        const doctor = await prisma.doctor.create({
            data: {
                userId: user_doctor.id,
                hospitalId: hospitals[d.hospitalIndex].id,
                specialization: d.specialization,
                experience: d.experience,
                licenseNumber: `DEMO-LIC-${i + 1}`
            }
        })

        doctors.push({ user_doctor, doctor })
    }

    //Patients:
    const patients = []

    for (let i=0; i<10; i++){
        const user_patient = await prisma.user.create({
            data: {
                email: `demo.patient${i + 1}@demo.telesana.com`,
                password: await bcrypt.hash("Demo@1234", 10),
                role: UserRole.PATIENT,
                isDemo: true,
                profile: {
                    create: {
                        name: `Patient ${i + 1}`,
                        age: 27 + i,
                        gender: i % 2 == 0 ? Gender.MALE : Gender.FEMALE
                    }
                }
            }
        })

        const patient = await prisma.patient.create({
            data: {userId: user_patient.id}
        })
        
        // Health Summary:
        await prisma.healthSummary.create({
            data: {
                patientId: patient.id,
                bloodGroup: (i % 8) == 0 ? BloodGroup.O_POS:
                            (i % 8) == 1 ? BloodGroup.A_POS:
                            (i % 8) == 2 ? BloodGroup.B_POS:
                            (i % 8) == 3 ? BloodGroup.AB_POS:
                            (i % 8) == 4 ? BloodGroup.O_NEG:
                            (i % 8) == 5 ? BloodGroup.A_NEG:
                            (i % 8) == 6 ? BloodGroup.B_NEG: BloodGroup.AB_NEG,
                heightCm: 160 + i,
                weightKg: 52 + i,
                notes: `Demo Health Summary - ${i + 1}`
            }
        })

        // Health Record: 
        await prisma.healthRecord.create({
            data: {
                patientId: patient.id,
                type: (i % 4) == 0 ? HealthRecordType.VISIT:
                      (i % 4) === 1 ? HealthRecordType.LAB:
                      (i % 4) === 2 ? HealthRecordType.PRESCRIPTION: HealthRecordType.NOTE,
                title: "Initial Consultation",
                description: "Routine demo consultation",
                createdBy: UserRole.DOCTOR
            }
        })

        patients.push({ user_patient, patient })
    }

    //Appointments:
    for(let i=0; i<patients.length; i++){
        const assignedDoctor = doctors[i % doctors.length]

        await prisma.appointment.create({
            data: {
                patientId: patients[i].patient.id,
                doctorId: assignedDoctor.doctor.id,
                dateTime: new Date(Date.now() + (i + 1) * 86400000),
                status: AppointmentStatus.SCHEDULED
            }
        })
    }

    //Reminders:
    const myDoctors = doctors.map((d) => d.user_doctor)
    const myPatients = patients.map((p) => p.user_patient)

    for (const user of [...myDoctors, ...myPatients]){
        await prisma.reminder.create({
            data: {
                userId: user.id,
                type: ReminderType.APPOINTMENT,
                message: "Upcoming appointment reminder",
                remindAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
            }
        })
    }

    for (const user of [...myPatients]){
        await prisma.reminder.create({
            data: {
                userId: user.id,
                type: ReminderType.MEDICINE,
                message: "Time to take your medicine~",
                remindAt: new Date(Date.now() + 6 * 60 * 60 * 1000)
            }
        })
    }

    console.log("Demo dataset seeded successfully");
}

seed()
    .catch((e) => {
        console.error("Seed failed", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })