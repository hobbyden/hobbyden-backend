const { response } = require("express");
const User = require("../models/User");
const { generateToken } = require("../utils/generateToken");
const customResponse = require("../utils/responseHandler");
const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
  try {
    const { username, email, password, dateOfBirth, interests } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return customResponse(res, 400, "User with this email already exists");
    }

    // else, continue

    // Hashing the pwd
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        dateOfBirth,
        interests,
      });
      await newUser.save();

      // setting the token
      const accessToken = generateToken(newUser);

      res.cookie("auth_token", accessToken, { httpOnly: true });

      return customResponse(res, 201, "User registered successfully", {
        username: newUser.username,
        email: newUser.email,
      });
    } else {
      return customResponse(res, 400, "Please provide a password");
    }

    // create the new user
  } catch (error) {
    console.log(error);
    return customResponse(res, 500, "Internal serve error", error.message);
  }
};


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if the user exists by email
    const user = await User.findOne({ email });
    if (!user) {
      return customResponse(res, 404, "User not found with this email");
    }
    // check the entered password
    const matchPassword = await bcrypt.compare(password, user.password);
    // password does not match
    if (!matchPassword) {
      return customResponse(res, 404, "Invalid Password");
    }

    const accessToken = generateToken(user);

    res.cookie("auth_token", accessToken, {
      httpOnly: true,
    });

    return customResponse(res, 201, "User logged in successfully", {
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.log(error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

const logoutUser = (req, res) => {
  try {
    res.cookie("auth_token", "", { httpOnly: true, expires: new Date(0) });
    return customResponse(res, 200, "Logged out successfully");
  } catch (error) {
    console.log(error);
    return customResponse(res, 500, "Internal server error", error.message);
  }
};

module.exports = { registerUser, loginUser, logoutUser };
