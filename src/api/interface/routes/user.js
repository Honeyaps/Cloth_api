import { UserOtpGenerate, UserSignup } from '../controller/users_controller.js';

export const UserRoute = (router) => {

    //     // for user to signup generate otp
    router.post("/user/generateOtp", UserOtpGenerate);

    router.post("/user/signup", UserSignup);

    // router.post("/user/signin", validateRequest(UserSigninValidate), UserSignin);

    // router.post("/user/logout", validateRequest(UserLogoutValidate), UserLogout);

    // // for user to reset password generate otp
    // router.post("/user/OTPforPass", validateRequest(UserOtpForPassValidate), UserOtpForPass);

    // router.post("/user/updatePass", validateRequest(UserUpdatePassValidate), UserUpdatePass);

    // router.post("/user/getProducts", getProductData)
    // router.post("/user/addToCart", addToCart)

}





