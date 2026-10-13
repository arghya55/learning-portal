import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import { connectDB } from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {

  try {

    await connectDB();

    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL
    });

    if (existingAdmin) {

      console.log("---------------------------------");
      console.log("Admin already exists");
      console.log(`Email: ${existingAdmin.email}`);
      console.log("---------------------------------");

      process.exit(0);
    }

    const hashedPassword =
      await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        12
      );

    const admin = await User.create({
      name: "Super Admin",

      email: process.env.ADMIN_EMAIL,

      password: hashedPassword,

      role: "ADMIN",

      department: null,

      employeeId: "ADMIN-001",

      active: true
    });

    console.log("---------------------------------");
    console.log("SUPER ADMIN CREATED");
    console.log("---------------------------------");
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log("Role: ADMIN");
    console.log("---------------------------------");

    process.exit(0);

  } catch (error) {

    console.error(
      "Admin creation failed:",
      error.message
    );

    process.exit(1);
  }
};

createAdmin();