import { Router } from "express";
import * as authServices from "./auth.service.js"
import * as validators from "./auth.validation.js";
import { validationMiddleWare } from "../../Middlewares/zod-validation.middleware.js";
import { ApplicationException } from "../../Utils/Security/ErrorException/error.exception.js";
import { authenticate } from "../../Middlewares/authentication.middleware.js";
import { decodeRefreshToken } from "../../Middlewares/decodeRefreshToken.middleware.js";
const authController = Router();


authController.post(
  "/signUp",
  validationMiddleWare(validators.signup),
  async (req, res) => {
    console.log(req.rateLimtInfo);
    
    const {
      firstName,
      lastName,
      email,
      password,
      gender,
      age,
      phone,
      confirmPassword,
      role
    } = req.validateData.body;
    const resulte = await authServices.signUp({
      firstName,
      lastName,
      email,
      password,
      gender,
      age,
      phone,
      confirmPassword,
      role,
    });
    console.log(req.rateLimtInfo);
    res.status(201).json({ Message: "User SignUP Successfuly ", resulte });
  },
);


authController.post("/signIn",validationMiddleWare(validators.login), async (req, res) => {
  const { email, password } = req.validateData.body;
  const token = await authServices.signIn({ email, password });

  res.status(200).json({ Message: "User SignIn Successfuly ", token});
});
authController.post( "/refresh-Token", async (req, res) => {
    const{refreshsignintoken} = req.headers;
    if (!refreshsignintoken)  throw ApplicationException({message:"refersh token is required"})
    const token = await authServices.refreshToken(refreshsignintoken);

    res.status(201).json({ Message: "User SignIn Successfuly ", token });
  },
);


authController.post("/signup-google" , async(req,res)=>{
    const{idToken}= req.body;
    if (!idToken) 
           throw ApplicationException({message:"Google Id Tpken Is Required"})
    const resulte = await authServices.googleSignup(idToken)
    res.status(201).json({message:"sign up successfuly" , resulte})
    

})
authController.post("/signin-google", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken)
    throw ApplicationException({ message: "Google Id Tpken Is Required" });
  const resulte = await authServices.googleSignin(idToken);
  res.status(201).json({ message: "sign in successfuly" , resulte });
});

authController.post("/logout", authenticate, decodeRefreshToken,async(req,res)=>{
console.log({
  accessTokenData: req.accessTokenData,
  refreshTokenData: req.refreshTokenData,
});

  const resulte = await authServices.logOut(
    req.accessTokenData,
    req.refreshTokenData,
  );
  res.status(201).json({message:"logout seccess" , resulte})
})

authController.patch("/confirm-email", async (req, res) => {
  const { email , otp} = req.body;
  
  const resulte = await authServices.confirmeEmail(email , otp);
  res.json({ message: "confirm email done", resulte });
});

authController.post("/resend-otp", async (req, res) => {
 const { email} = req.body;
  const resulte = await authServices.reSendOtp(email);
  res.json({ message: "OTP Resend Successfully", resulte });
});
authController.post("/forget-password", async (req, res) => {
  const { email } = req.body;
  const resulte = await authServices.forgetPassword(email);
  res.json({ message: "OTP send Successfully", resulte });
});
authController.post("/reset-password",validationMiddleWare(validators.forgetPassword), async (req, res) => {
  const { email, resetToken, newPassword , confirmPassword } = req.body;
  const resulte = await authServices.resetPassword({ 
    email,
    resetToken,
    newPassword,
    confirmPassword,
});
  res.json({ message: "Password Changing Successfuly", resulte });
});

export default authController;