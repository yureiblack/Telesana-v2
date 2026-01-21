require('dotenv').config()
const {PrismaClient, UserRole, ReminderType, AppointmentStatus, Gender, HealthRecordType, BloodGroup, DayPeriod} = require('@prisma/client')
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
      name: "Dr. Eva Heinemann",
      specialization: "General Physician",
      experience: 12,
      hospitalIndex: 0,
    },
    {
      name: "Dr. Johan Liebert",
      specialization: "Cardiologist",
      experience: 15,
      hospitalIndex: 0,
    },
    {
      name: "Dr. Nina Fortner",
      specialization: "Dermatologist",
      experience: 8,
      hospitalIndex: 1,
    },
    {
      name: "Dr. Kenzo Tenma",
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
    const names = ["Eren Yeager", "Mikasa Ackerman", "Armin Arlert", "Annie Leonhart", "Erwin Smith", "Historia Reiss", "Levi Ackerman", "Sasha Braus", "Jean Kirstein", "Hange Zoë"]

    for (let i=0; i<10; i++){
        const user_patient = await prisma.user.create({
            data: {
                email: `demo.patient${i + 1}@demo.telesana.com`,
                password: await bcrypt.hash("Demo@1234", 10),
                role: UserRole.PATIENT,
                isDemo: true,
                profile: {
                    create: {
                        name: names[i],
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

        // Health Record created by doctor: 
        const assignedDoctor = doctors[i % doctors.length]
        await prisma.healthRecord.create({
            data: {
                patientId: patient.id,
                createdByUserId: assignedDoctor.user_doctor.id,
                type: (i % 4) == 0 ? HealthRecordType.VISIT:
                      (i % 4) === 1 ? HealthRecordType.LAB:
                      (i % 4) === 2 ? HealthRecordType.PRESCRIPTION: HealthRecordType.NOTE,
                title: "Initial Consultation",
                description: "Routine demo consultation",
            }
        })

        // Prescription with Medicines:
        const prescription = await prisma.prescription.create({
            data: {
                patientId: patient.id,
                doctorId: assignedDoctor.doctor.id,
                notes: "Demo Prescription",
                medicines: {
                    create: [
                        { name: `Medicine A${i + 1}`, dosage: "1 pill", isActive: true },
                        { name: `Medicine B${i + 1}`, dosage: "2 pills", isActive: true }
                    ]
                }
            },
            include: { medicines: true }
        })

        // Medicine Schedule & Slots
        const periods = [DayPeriod.MORNING, DayPeriod.EVENING, DayPeriod.NIGHT]
        for (const med of prescription.medicines) {
            const schedule = await prisma.medicineSchedule.create({
                data: {
                    medicineId: med.id,
                    period: periods[i % periods.length]
                }
            })

            const slot = await prisma.medicineScheduleSlot.create({
                data: {
                    patientId: patient.id,
                    scheduleId: schedule.id,
                    time: new Date(Date.now() + 8 * 60 * 60 * 1000) // demo 8 hours later
                }
            })

            // Medicine reminder
            await prisma.reminder.create({
                data: {
                    userId: user_patient.id,
                    type: ReminderType.MEDICINE,
                    scheduleSlotId: slot.id,
                    message: `Time to take ${med.name}`,
                    remindAt: slot.time
                }
            })
        }

        patients.push({ user_patient, patient })
    }

    // Appointments + Appointment Reminders
    for (let i = 0; i < patients.length; i++) {
        const assignedDoctor = doctors[i % doctors.length]

        const appointment = await prisma.appointment.create({
            data: {
                patientId: patients[i].patient.id,
                doctorId: assignedDoctor.doctor.id,
                dateTime: new Date(Date.now() + (i + 1) * 86400000),
                status: AppointmentStatus.SCHEDULED
            }
        })

        // Appointment reminder (1 hour before)
        await prisma.reminder.create({
            data: {
                userId: patients[i].user_patient.id,
                type: ReminderType.APPOINTMENT,
                appointmentId: appointment.id,
                message: "Upcoming appointment reminder",
                remindAt: new Date(appointment.dateTime.getTime() - 60 * 60 * 1000)
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