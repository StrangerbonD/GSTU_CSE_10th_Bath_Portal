using GstuPortal.Application.Common.Interfaces;
using GstuPortal.Domain.Entities;
using GstuPortal.Domain.Enums;
using GstuPortal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GstuPortal.Infrastructure.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        // 1. Seed Users if none exist
        if (!await context.Users.AnyAsync())
        {
            var adminPassword = Environment.GetEnvironmentVariable("ADMIN_DEFAULT_PASSWORD");
            if (string.IsNullOrWhiteSpace(adminPassword))
            {
                var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                if (!string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException("CRITICAL SECURITY: ADMIN_DEFAULT_PASSWORD environment variable must be set in production.");
                }
                adminPassword = "DevAdmin@" + Guid.NewGuid().ToString("N")[..8] + "!";
            }

            var admin = new User(
                username: "admin",
                fullName: "System Admin (GSTU CSE)",
                email: "admin@gstu.ac.bd",
                passwordHash: passwordHasher.HashPassword(adminPassword),
                role: UserRole.Admin);

            admin.MarkEmailAsVerified();

            var isDev = string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Development", StringComparison.OrdinalIgnoreCase);

            context.Users.Add(admin);

            if (isDev)
            {
                var demoStudent = new User(
                    username: "bondhon",
                    fullName: "Bondhon Saha",
                    email: "bondhon@gstu.ac.bd",
                    passwordHash: passwordHasher.HashPassword("Bondhon@1234"),
                    role: UserRole.Student,
                    studentId: "19CSE024");
                demoStudent.ApproveClaim();
                demoStudent.MarkEmailAsVerified();
                context.Users.Add(demoStudent);
            }

            await context.SaveChangesAsync();
        }

        // 2. Seed Students and Transcripts if none exist
        if (!await context.Students.AnyAsync())
        {
            var bondhon = new Student(
                studentId: "19CSE024",
                studentName: "Bondhon Saha",
                cgpa: 3.84,
                totalCredits: 160,
                isDistinction: true,
                meritRank: 2);

            // Add 8 semesters for 19CSE024
            var s1 = new SemesterResult(1, 1, "1st Year 1st Semester", 3.78, 20.0, 20.0);
            s1.Courses.Add(new CourseGrade("CSE 1101", "Structured Programming Language", 3.0, "A+", 4.0));
            s1.Courses.Add(new CourseGrade("CSE 1102", "Structured Programming Lab", 1.5, "A+", 4.0));
            s1.Courses.Add(new CourseGrade("MATH 1101", "Differential and Integral Calculus", 3.0, "A", 3.75));
            s1.Courses.Add(new CourseGrade("PHY 1101", "Physics (Waves & Optics)", 3.0, "A-", 3.5));
            s1.Courses.Add(new CourseGrade("HUM 1101", "English Language & Communication", 2.0, "A", 3.75));

            var s2 = new SemesterResult(1, 2, "1st Year 2nd Semester", 3.82, 20.5, 20.5);
            s2.Courses.Add(new CourseGrade("CSE 1201", "Discrete Mathematics", 3.0, "A+", 4.0));
            s2.Courses.Add(new CourseGrade("CSE 1203", "Electrical Circuits & Electronics", 3.0, "A", 3.75));
            s2.Courses.Add(new CourseGrade("CSE 1204", "Electrical Circuits Lab", 1.5, "A+", 4.0));
            s2.Courses.Add(new CourseGrade("MATH 1201", "Coordinate Geometry & Linear Algebra", 3.0, "A", 3.75));
            s2.Courses.Add(new CourseGrade("CHEM 1201", "Chemistry & Material Science", 3.0, "A-", 3.5));

            var s3 = new SemesterResult(2, 1, "2nd Year 1st Semester", 3.85, 20.0, 20.0);
            s3.Courses.Add(new CourseGrade("CSE 2101", "Data Structures", 3.0, "A+", 4.0));
            s3.Courses.Add(new CourseGrade("CSE 2102", "Data Structures Sessional Lab", 1.5, "A+", 4.0));
            s3.Courses.Add(new CourseGrade("CSE 2103", "Digital Logic Design (DLD)", 3.0, "A", 3.75));
            s3.Courses.Add(new CourseGrade("CSE 2104", "Digital Logic Design Lab", 1.5, "A+", 4.0));
            s3.Courses.Add(new CourseGrade("MATH 2101", "Ordinary Differential Equations", 3.0, "A", 3.75));

            var s4 = new SemesterResult(2, 2, "2nd Year 2nd Semester", 3.88, 20.5, 20.5);
            s4.Courses.Add(new CourseGrade("CSE 2201", "Design & Analysis of Algorithms", 3.0, "A+", 4.0));
            s4.Courses.Add(new CourseGrade("CSE 2202", "Algorithms Sessional Lab", 1.5, "A+", 4.0));
            s4.Courses.Add(new CourseGrade("CSE 2203", "Object Oriented Programming (Java)", 3.0, "A+", 4.0));
            s4.Courses.Add(new CourseGrade("CSE 2204", "Object Oriented Programming Lab", 1.5, "A+", 4.0));
            s4.Courses.Add(new CourseGrade("STAT 2201", "Statistics and Probability", 3.0, "A", 3.75));

            var s5 = new SemesterResult(3, 1, "3rd Year 1st Semester", 3.86, 20.0, 20.0);
            s5.Courses.Add(new CourseGrade("CSE 3101", "Database Management Systems (DBMS)", 3.0, "A+", 4.0));
            s5.Courses.Add(new CourseGrade("CSE 3102", "Database Management Systems Lab", 1.5, "A+", 4.0));
            s5.Courses.Add(new CourseGrade("CSE 3103", "Operating Systems", 3.0, "A", 3.75));
            s5.Courses.Add(new CourseGrade("CSE 3104", "Operating Systems Lab", 1.5, "A+", 4.0));
            s5.Courses.Add(new CourseGrade("CSE 3105", "Theory of Computation", 3.0, "A", 3.75));

            var s6 = new SemesterResult(3, 2, "3rd Year 2nd Semester", 3.84, 19.5, 19.5);
            s6.Courses.Add(new CourseGrade("CSE 3201", "Computer Networks & Security", 3.0, "A+", 4.0));
            s6.Courses.Add(new CourseGrade("CSE 3202", "Computer Networks Lab", 1.5, "A+", 4.0));
            s6.Courses.Add(new CourseGrade("CSE 3203", "Software Engineering & UML", 3.0, "A", 3.75));
            s6.Courses.Add(new CourseGrade("CSE 3205", "Microprocessors & Microcontrollers", 3.0, "A", 3.75));
            s6.Courses.Add(new CourseGrade("CSE 3206", "Microprocessors Lab", 1.5, "A+", 4.0));

            var s7 = new SemesterResult(4, 1, "4th Year 1st Semester", 3.85, 20.0, 20.0);
            s7.Courses.Add(new CourseGrade("CSE 4101", "Artificial Intelligence & Expert Systems", 3.0, "A+", 4.0));
            s7.Courses.Add(new CourseGrade("CSE 4102", "Artificial Intelligence Lab", 1.5, "A+", 4.0));
            s7.Courses.Add(new CourseGrade("CSE 4103", "Compiler Design", 3.0, "A", 3.75));
            s7.Courses.Add(new CourseGrade("CSE 4104", "Compiler Design Lab", 1.5, "A+", 4.0));
            s7.Courses.Add(new CourseGrade("CSE 4100", "Undergraduate Project & Thesis I", 2.0, "A+", 4.0));

            var s8 = new SemesterResult(4, 2, "4th Year 2nd Semester", 3.89, 19.5, 19.5);
            s8.Courses.Add(new CourseGrade("CSE 4201", "Machine Learning & Pattern Recognition", 3.0, "A+", 4.0));
            s8.Courses.Add(new CourseGrade("CSE 4202", "Machine Learning Lab", 1.5, "A+", 4.0));
            s8.Courses.Add(new CourseGrade("CSE 4203", "Computer Graphics & Multimedia", 3.0, "A", 3.75));
            s8.Courses.Add(new CourseGrade("CSE 4200", "Undergraduate Project & Thesis Final", 4.0, "A+", 4.0));
            s8.Courses.Add(new CourseGrade("CSE 4299", "Comprehensive Oral Viva", 1.0, "A+", 4.0));

            bondhon.Semesters.Add(s1);
            bondhon.Semesters.Add(s2);
            bondhon.Semesters.Add(s3);
            bondhon.Semesters.Add(s4);
            bondhon.Semesters.Add(s5);
            bondhon.Semesters.Add(s6);
            bondhon.Semesters.Add(s7);
            bondhon.Semesters.Add(s8);

            // Also seed other classmates for Batch Statistics
            var afrin = new Student("20CSE008", "Afrin Jahan", 3.899, 161, true, 1);
            var iftaker = new Student("20CSE036", "Iftaker Siddique", 3.703, 161, false, 3);
            var nimoor = new Student("20CSE010", "Moha. Nimoor Hossain", 3.626, 161, false, 4);

            context.Students.AddRange(bondhon, afrin, iftaker, nimoor);
            await context.SaveChangesAsync();
        }
    }
}
