import mongoose from 'mongoose';
import dotenv from 'dotenv';
import users from './data/users.js';
import courses from './data/courses.js';
import User from './models/user.model.js';
import Course from './models/course.model.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
    try {
        // Clear existing data
        await Course.deleteMany();
        await User.deleteMany();

        console.log('Cleared existing data...');

        // Create users one by one to trigger the 'pre-save' hook for password hashing
        console.log('Creating users with hashed passwords...');
        const createdUsers = [];
        for (const userData of users) {
            // User.create triggers the 'save' middleware
            const user = await User.create(userData);
            createdUsers.push(user);
        }
        console.log(`${createdUsers.length} users created.`);


        // Separate tutors and students from the created users
        const tutors = createdUsers.filter((user) => user.role === 'tutor');
        const students = createdUsers.filter((user) => user.role === 'student');

        // Assign a random tutor as the instructor for each course
        const coursesWithInstructors = courses.map((course) => {
            const randomTutor = tutors[Math.floor(Math.random() * tutors.length)];
            return { ...course, instructor: randomTutor._id };
        });

        // Insert courses
        const createdCourses = await Course.insertMany(coursesWithInstructors);
        console.log(`${createdCourses.length} courses created.`);

        // Enroll students in courses
        for (const student of students) {
            // Each student will enroll in 1 to 5 random courses
            const numberOfCoursesToEnroll = Math.floor(Math.random() * 5) + 1;
            const shuffledCourses = [...createdCourses].sort(() => 0.5 - Math.random());
            const coursesToEnroll = shuffledCourses.slice(0, numberOfCoursesToEnroll);

            for (const course of coursesToEnroll) {
                // Add course to student's enrolled list
                student.enrolledCourses.push(course._id);
                // Increment enrollment count on the course
                course.enrollments = (course.enrollments || 0) + 1;
                await course.save();
            }
            await student.save();
            console.log(`Student ${student.fullName} enrolled in ${numberOfCoursesToEnroll} courses.`);
        }

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Course.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Check for command-line argument to decide whether to import or destroy
if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}