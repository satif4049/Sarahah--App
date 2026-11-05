import {
  NotFoundException,
  ConfilectException,
} from "../../Utils/Security/ErrorException/error.exception.js";
import { decryption } from "../../Utils/Security/encryption.security.js";
import { hash } from "../../Utils/Security/hash.security.js";
import UserRepository from "../../DB/Repositories/user.repository.js"
const userRepo = new UserRepository()

export const getUserProfileById = async (user) => {
  console.log(user);
  
  if (user.phone) user.phone = decryption(user.phone);
  console.log(user);
  
  return user;
};

export const getUsersProfile = async () => {
  // User.find().select("firstName lastName gender age");
  return await userRepo.findDocument();
};

export const updateUserProfileById = async ( userId ,{ firstName, lastName, email, password, gender, age, phone }) => {
  const user = await userRepo.findDocumentByID(userId);
  if (!user) throw NotFoundException("User Id Not Found" );
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  const passwordHashing = await hash(password);
  if (password) {
    user.password = passwordHashing;
  }
  if (gender) user.gender = gender;
  if (age) user.age = age;
  if (phone) user.phone = phone;
  if (email) {
    const isExist = await userRepo.findOneDocument({ email });
    if (isExist)
          throw ConfilectException("Email Elready Exist");
    user.email = email;
  }

  return user.save();
};

export const deleteProfileById = async (userId) => {
  const user = await userRepo.findDocumentByID(userId);
  if (!user) throw NotFoundException("User Id Not Found");

  return user.deleteOne();
};

export const uploudProfilePicture = async (file , user) => {
   return userRepo.updateDocumentById(user._id, { profilePicture : file.path} , {new : true});
}