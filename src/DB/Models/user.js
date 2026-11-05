import mongoose from "mongoose";
import { genderEnum, roleEnum , providersEnum } from "../../Common/Enum/user.enum.js";



const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Name is required"],
      minLength: [3, "First Name Must Be At Least 3 Characters"],
      maxLength: [10, "First Name Must Be At Most 10 Characters"],
      lowercase: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Name is required"],
      minLength: [3, "Last Name Must Be At Least 3 Characters"],
      maxLength: [10, "Last Name Must Be At Most 10 Characters"],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      index: { name: "idx_email_unique", unique: true },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    gender: {
      type: String,
      enum: Object.values(genderEnum),
      default: genderEnum.male,
    },
    role: {
      type: String,
      enum: Object.values(roleEnum),
      default: roleEnum.user,
    },
    age: {
      type: Number,
      min: [18, "Age Must Be At Last 18"],
      max: [100, "Age Must Be At Most 100"],
    },
    googleSub: {
      type: String,
      index: {
        name: "idx_googlesub",
        unique: true,
      },
    },
    isEmailVerivcation:{
      type:Boolean,
      default:false
    },
    providers: {
      type: String,
      enum: Object.values[providersEnum],
      default: providersEnum.system
    },
    profilePicture: {
      type: String,
    },
    phone: String,
  },
  {
    virtuals: {
      fullName: {
        get() {
          return `${this.firstName}  ___ ${this.lastName}`;
        },
      },
    },
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);


const User = mongoose.model("User" , userSchema);
console.log("all Models" , mongoose.models);

export default User;