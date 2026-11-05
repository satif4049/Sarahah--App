import { encryption } from "../../Utils/Security/encryption.security.js";
import { compareTwoHashs, hash } from "../../Utils/Security/hash.security.js";
import UserRepository from "../../DB/Repositories/user.repository.js";
import { ApplicationException, ConfilectException, UnAuthorizedException } from "../../Utils/Security/ErrorException/error.exception.js";
import envConfig from "../../Configs/env.config.js";
import { decodeToken, generateToken } from "../../Utils/token.utils.js";
import { emailOtpEXpiration, providersEnum, roleEnum } from "../../Common/Enum/user.enum.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto"
import { v4 as uuidv4 } from "uuid";
import { tokenTypeEnum } from "../../Common/Enum/token.enum.js";
import { calcTTl, del, get, set } from "../../Common/Services/redis.services.js";
import { eventEmitter } from "../../Common/Services/email.services.js";
import { log } from "node:console";
const userRepo = new UserRepository()
const {user:userConfig , admin:adminConfig} = envConfig.jwt;

const handleSendingVerficationOtp = async(email)=>{
   const otp = crypto.randomInt(100000 ,1000000).toString();
  const hashedOtp = await hash(otp)
  eventEmitter.emit("sendEmail", {
    to: email,
    subject: "Email Vervication",
    message: `<h1> this is your verivication OTP</h1>
      <h2>${otp}</h2>
      <h3>this otp valid for 5 min</h3>
    `,
  });
  set({
    key: `email_vervication:${email}`,
    value: hashedOtp,
    options: { EX: emailOtpEXpiration },
  });
}

const createPasswordResetToken = async (email) => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = await hash(resetToken);
  await set({
    key: `reset_password:${email}`,
    value: hashedResetToken,
    options: { EX: 600 },
  });

  // 4. Return the original token to the frontend
  return {
    message: "OTP verified successfully",
    resetToken,
  };
};

export const signUp = async (body) => {
  const {
    firstName,
    lastName,
    email,
    password,
    gender,
    age,
    phone,
    confirmPassword,
    role,
  } = body;
  //  User.findOne({ email });
  const isEmailExist = await userRepo.findOneDocument({ email });
  if (isEmailExist)
       throw ConfilectException("Email Already Exist");

  // Encryption
  let encryptedNumber;
  if (phone) encryptedNumber = encryption(phone);

  const passwordHashing = await hash(password);
  console.log("BEFORE CREATE:",passwordHashing);
  // await User.create
 handleSendingVerficationOtp(email)
  return await userRepo.creatDocument({
    firstName,
    lastName,
    email,
    password: passwordHashing,
    confirmPassword,
    gender,
    age,
    phone: encryptedNumber || undefined,
    role,
  });
};

const bulitSecrtKey = (user)=>{
 
  
  let secretKey;
  switch (user.role) {
    case roleEnum.user:
      secretKey = userConfig;

      break;
    case roleEnum.admin:
      secretKey = adminConfig;

      break;
    default:
      throw ApplicationException({ message: "role not found" });
  }

return secretKey
}

 const bulitTokens =(user)=>{

let bayload = {
  userId: user._id,
  email: user.email,
  role: user.role,
  jwtid:uuidv4()
};


let secretKey = bulitSecrtKey(user)
const accessToken = generateToken(
  bayload,
  secretKey.access_token_secrt,
  {
    expiresIn: secretKey.access_token_secrt_expires_in,
  },
);

const refreshToken = generateToken(
  bayload,
  secretKey.refresh_token_secrt,
  {
    expiresIn: secretKey.refresh_token_secrt_expires_in,
  },
);
console.log({ accessToken, refreshToken });
return { message: " generate Tokens", accessToken, refreshToken };
 }

export const signIn = async (body) => {
  const { email, password } = body;

  const user = await userRepo.findOneDocument({ email });
  if (!user) throw UnAuthorizedException(" Inavlid Email Or Password");
  console.log({ user: user.password, password });

  const isPasswordMatched = await compareTwoHashs(password, user.password);
  console.log({ isPasswordMatched });

  if (!isPasswordMatched)
    throw UnAuthorizedException(" Inavlid Email Or Password");

  if (!user.isEmailVerivcation)
    throw UnAuthorizedException(" please confirm your email");

  return bulitTokens(user);
}; 

export const refreshToken= async(userRefreshToken)=>{
  const {user} = await decodeToken({token:userRefreshToken , tokenType : tokenTypeEnum.Refresh_Token});
console.log(user);
let secretKey = bulitSecrtKey(user);
   const accessToken = generateToken(
     { userId: user._id, email: user.email, role: user.role, jwtid: uuidv4() },
     secretKey.access_token_secrt,
     {
       expiresIn: secretKey.access_token_secrt_expires_in,
     },
   );
   return { message: " generate Tokens successfuly", accessToken}
}

const verifyIdToken =async (token)=>{
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: envConfig.gcp.gcp_clint_id, 
    });
    const payload = ticket.getPayload();
    return payload;
  }


  const updateOrCreat = async(user , googleIdTokenPayload)=>{
    const {sub , email , given_name , family_name}= googleIdTokenPayload;
    if (user) {
        return userRepo.updateDocumentById(user._id , {email , firstName:given_name , lastName:family_name} , {new:true})
    } else {
      const passwordHashing = await hash( crypto.randomBytes(12).toString("hex"))
      return userRepo.creatDocument({
        googleSub:sub,
        providers:providersEnum.google,
        email,
        password:passwordHashing,
        firstName: given_name,
        lastName: family_name||" ",
      });
    }
  }


export const googleSignup =async(idToken)=>{
  const googleIdTokenPayload = await verifyIdToken(idToken);
  if (!googleIdTokenPayload || !googleIdTokenPayload.email_verified)  throw ApplicationException({message:"Email not verified"})
  const user = await userRepo.findOneDocument({
      googleSub:googleIdTokenPayload.sub,
      providers: providersEnum.google
  })

  const handleUser = await updateOrCreat (user , googleIdTokenPayload)
  
       return bulitTokens(handleUser)

}



export const googleSignin = async (idToken) => {
 const googleIdTokenPayload = await verifyIdToken(idToken);
 if (!googleIdTokenPayload || !googleIdTokenPayload.email_verified)
   throw ApplicationException({ message: "Email not verified" });
 const user = await userRepo.findOneDocument({
   googleSub: googleIdTokenPayload.sub,
   providers: providersEnum.google,
 });
 if (!user)
   throw ApplicationException({ message: "user not found" });

};
/**
 * accessToken
 * refreshToken
 * accessTokenData: {
    userId: '6acf9dc68f8eb16e7398e36b',
    email: 'jgda@gmail.com',
    role: 'admin',
    jwtid: '012501d6-8266-4eaa-8c84-2aebca947397',
    iat: 1792154730,
    exp: 1792158330
  },
  refreshTokenData: {
    userId: '6acf9dc68f8eb16e7398e36b',
    email: 'jgda@gmail.com',
    role: 'admin',
    jwtid: '012501d6-8266-4eaa-8c84-2aebca947397',
    iat: 1792154730,
    exp: 1792759530
  }
 * iwtid
 * bl_accessToken_jwtid
 * bl_refreshToken_jwtid
 * 
 * ttl
 * 
 * expireIN - currentTime
 * 
 */


export const logOut = async (accessTokenData , refreshTokenData) => {
 const {exp:accessExpireIn , jwtid:accessId} = accessTokenData;
  const { exp: refreshExpireIn, jwtid: refreshId } = refreshTokenData;
const accessTTL = calcTTl(accessExpireIn);
const refreshTTL = calcTTl(refreshExpireIn);

Promise.all([
  set({
    key: `bl_${tokenTypeEnum.Access_Token}_${accessId}`,
    value: "true",
    options: { EX: accessTTL },
  }),
  set({
    key: `bl_${tokenTypeEnum.Refresh_Token}_${refreshId}`,
    value: "true",
    options: { EX: refreshTTL },
  }),
]);
return {accessTTL , refreshTTL}

}

export const confirmeEmail =async (email , otp)=>{
 const hashedOtp = await get(`email_vervication:${email}`);
 if (!hashedOtp) {
      throw ApplicationException({message:"invalid email or your otp is expirein"})
 }
 const isValidHashed = await compareTwoHashs(otp.toString(), hashedOtp);
 
 console.log({ isValidHashed });
 
 if (!isValidHashed) {
     throw ApplicationException({
       message: "invalid your otp ",
     });
 }
 console.log({isValidHashed});
 
//  if valid ==> update db and delete key of otp to become valid only one use
await userRepo.findOneAndUpdate({ email }, { isEmailVerivcation: true });
 
 
   del(`email_vervication:${email}`);
   return createPasswordResetToken(email)
}


export const reSendOtp = async (email) => {
  const user = await userRepo.findOneDocument({email});
  console.log({user});
  if (!user) throw ApplicationException({message:"Email Not Found"})
  if (user.isEmailVerivcation) throw ApplicationException({ message: "Email Already Verified" }); 

   await handleSendingVerficationOtp(user.email)

    return true
  
}

export const forgetPassword = async (email) => {
  const user = await userRepo.findOneDocument({ email });
  console.log({ user });
  if (!user) throw ApplicationException({ message: "There are no accounts in this email , Please go to register Page" });
 
  await handleSendingVerficationOtp(user.email);

  return true;
};

 export const resetPassword = async ({
   email,
   resetToken,
   newPassword,
   confirmPassword,
 }) => {
 
   const hashedResetToken = await get(`reset_password:${email}`);
   if (!hashedResetToken) {
     throw ApplicationException({
       message: "Reset token expired or invalid",
     });
   }

   const isValidToken = await compareTwoHashs(
     resetToken,
     hashedResetToken,
   );
  console.log({isValidToken});
  
   if (!isValidToken) {
     throw ApplicationException({
       message: "Reset token expired or invalid",
     });
   }

   const hashedPassword = await hash(newPassword);

   const updatedUser = await userRepo.findOneAndUpdate(
     { email },
     {  password: hashedPassword  , confirmPassword} ,
     
   );
   if (!updatedUser) {
     throw ApplicationException({
       message: "User not found",
     });
   }

   await del( `reset_password:${email}`);

   return {
     message: "Password reset successfully",
   };
 };





