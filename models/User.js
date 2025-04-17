const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    // Add Auth0 specific fields
    auth0Id: {
      type: String,
      unique: true,
      sparse: true, // Allow null values (for existing users)
    },
    picture: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving - only if password is modified and we're not using Auth0
userSchema.pre("save", async function (next) {
  // Skip password hashing if Auth0 is handling authentication
  if (this.auth0Id) return next();

  // Only hash the password if it has been modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password - will be used for legacy users not on Auth0 yet
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
