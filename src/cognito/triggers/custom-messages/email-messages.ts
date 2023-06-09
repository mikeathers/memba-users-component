import _ from 'lodash'

import {CustomMessageReturnValue} from './custom-message'

const head = `
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />  
  <link rel="preconnect" href="https://fonts.googleapis.com"> 
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> 
  <link
    href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap"
    rel="stylesheet"
  />    

  <style type="text/css">  
  h1, h2, h3, h4, p {
    padding: 0;
    margin: 0;
  }
  p {
    color: #BDB6A9;
  }    
  
  html {          
      display: flex;
      justify-content: center;
      align-items: center;        
  }

  body {
      margin: 0;
      padding: 0;      
      background-color: #1f2128;
      color: #828892; 
      font-family: "Roboto", sans-serif ;
    }
    
    .ii a[href] {
      color: #1f2128 !important;
    }
    
    .container {
      background-color: #1f2128;
      padding: 24px;
      width: 100%;
    }
   
    .heroImage { 
      height: 110px;
      width: 100%;
      margin-bottom: -15px;
      object-fit: cover;
    }


   h2 {
      color: #fff;
      margin-left: 8px;
    }
    
   h4 {
     color: #BDB6A9;
     font-size: 18px;
   }     
   

  @media only screen and (min-width: 520px) {        
    .container {
      width: 750px;
    }      

    .heroImage {
      width: 100%;  
      height: 100%;          
    }          
  }
   
  </style>
</head>
`

export const completeSignup = (link: string): CustomMessageReturnValue => {
  return {
    emailSubject: `Confirm your heatio account`,
    emailMessage: `
   <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

    ${head}

    <body>
    <div class="container">
        <div style="margin-bottom: 24px; ">
<!--          <img src="" style="width: 105px;" />-->
          <p style="font-size: 12px; color: #828892; float: right; font-family: Roboto,arial;">Didn't request this? Ignore me</p>  
        </div>
        <div style="background-color: #252C37; border-radius: 8px; overflow: hidden; ">
<!--        <img class="heroImage" src="https://heatio-assets.s3.eu-west-2.amazonaws.com/confirm-account-hero.png"/>-->
        <div style="padding: 32px; margin-top: -15px;">  
          <div style="display: flex; margin-bottom: 8px; margin-top: 8px;">     
<!--            <img style="height: 16px; margin-top: 5px; margin-bottom: 8px;" src="https://heatio-assets.s3.eu-west-2.amazonaws.com/tick-icon-x4.png" />   -->
            <h2 style="font-family: Roboto,arial;">One click away</h1>
          </div>
          <h4 style="font-family: Roboto,arial;">Verify your account</h4>
          <p style="font-family: Roboto,arial; margin-top: 24px; margin-bottom: 32px; font-size: 16px; line-height: 26px;">Once you’ve pressed the link you will be directed back to the app, and that’s it, your account will be verified.</p>
          <a href=${link}
            style="height: 48px;
            font-family: Roboto,arial;
             width: 189px;
             background-color: #fff;
             color: #1F2128;
             border-radius: 8px;
             display: table-cell;
             text-align: center;
             vertical-align: middle;
             font-weight: 600;
             font-size: 16px;
             text-decoration: none;
             margin-bottom: 16px;"
           >
            Verify account       
<!--           <img style="height: 10px; margin-top: 3px; margin-left: 4px;" src="https://heatio-assets.s3.eu-west-2.amazonaws.com/arrow-icon-x4.png" />   -->
          </a>      
          <p style="font-family: Roboto,arial; margin-top: 24px; word-wrap: break-word; line-height: 26px; font-size: 16px;">Or paste this link: <span style="color: #F5EFE3 !important; font-size: 16px;">${link}</strong></p>
          <div style="background-color: #37302A; display: flex; padding: 16px; font-size: 14px; margin-top: 32px; border-radius: 4px">   
<!--            <img style="height: 13px; margin-top: 3px; margin-right: 8px;" src="https://heatio-assets.s3.eu-west-2.amazonaws.com/envelope-icon-x4.png" />        -->
            <p style="font-family: Roboto,arial; color: #FF8720;">Got a question? <a href="www.memba.co.uk" style=" color: #FF8720; font-size: 14px;">Reach out to us</a></p>
          </div>
        </div>
        </div>
        <div style="margin-top: 24px;text-align: center;">
          <p style="font-family: Roboto,arial; margin-bottom: 8px;">Edward Pavilion, Royal Albert Dock, Liverpool L3 4AF</p>
          <p style="font-family: Roboto,arial;">© 2023 by Memba Ltd</p>
        </div>
        </div>
    </body>
</html>
`,
  }
}

export const forgotPassword = (link: string): CustomMessageReturnValue => {
  return {
    emailSubject: `Change your password`,
    emailMessage: `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

  ${head}

  <body>
    <div class="container">
      <div style="margin-bottom: 24px; ">
        <img src="https://heatio-assets.s3.eu-west-2.amazonaws.com/heatio-text-taupe.png" style="width: 105px;" />
        <p style="font-size: 12px; color: #828892; float: right; font-family: Roboto,arial;">Didn't request this? Ignore me</p>  
      </div>
      <div style="background-color: #252C37; border-radius: 8px; overflow: hidden; ">
<!--      <img class="heroImage" src="https://heatio-assets.s3.eu-west-2.amazonaws.com/hero-reset-password.png"/>-->
      <div style="padding: 32px; margin-top: -15px;">  
        <div style="display: flex; margin-bottom: 8px; margin-top: 8px;">     
<!--          <img style="height: 16px; margin-top: 5px; margin-bottom: 8px;" src="https://heatio-assets.s3.eu-west-2.amazonaws.com/key-icon-x4.png" />   -->
          <h2 style="font-family: Roboto,arial;">Let's solve this</h1>
        </div>
        <h4 style="font-family: Roboto,arial;">Reset your password</h4>
        <p style="font-family: Roboto,arial; margin-top: 24px; margin-bottom: 32px; font-size: 16px; line-height: 26px;">Once you’ve pressed the link you will be directed back to the app, you can then choose your new password.</p>
        <a href=${link}
          style="height: 48px;
          font-family: Roboto,arial;
           width: 189px;
           background-color: #fff;
           color: #1F2128;
           border-radius: 8px;
           display: table-cell;
           text-align: center;
           vertical-align: middle;
           font-weight: 600;
           font-size: 16px;
           text-decoration: none;
           margin-bottom: 16px;"
         >
          Reset password       
<!--         <img style="height: 10px; margin-top: 3px; margin-left: 4px;" src="https://heatio-assets.s3.eu-west-2.amazonaws.com/arrow-icon-x4.png" />   -->
        </a>      
        <p style="font-family: Roboto,arial; margin-top: 24px; word-wrap: break-word; line-height: 26px; font-size: 16px;">Or paste this link: <span style="color: #F5EFE3 !important; font-size: 16px;">${link}</strong></p>
        <div style="background-color: #37302A; display: flex; padding: 16px; font-size: 14px; margin-top: 32px; border-radius: 4px">   
<!--          <img style="height: 13px; margin-top: 3px; margin-right: 8px;" src="https://heatio-assets.s3.eu-west-2.amazonaws.com/envelope-icon-x4.png" />        -->
          <p style="font-family: Roboto,arial; color: #FF8720;">Got a question? <a href="www.memba.co.uk" style=" color: #FF8720; font-size: 14px;">Reach out to us</a></p>
        </div>
      </div>
      </div>
      <div style="margin-top: 24px;text-align: center;">
        <p style="font-family: Roboto,arial; margin-bottom: 8px;">Edward Pavilion, Royal Albert Dock, Liverpool L3 4AF</p>
        <p style="font-family: Roboto,arial;">© 2023 by Memba Ltd</p>
      </div>
      </div>
    </body>
</html>
`,
  }
}

export const verifyNewEmail = (
  link: string,
  firstName: string,
): CustomMessageReturnValue => {
  return {
    emailSubject: `Verify your email address! 🔥`,
    emailMessage: `
    <div>
      <div>
        <h1>Hi ${_.startCase(_.camelCase(firstName))} 👋</h1>
        <p>It looks like you've updated your email address!</p>
        <p>Click on the link below to verify.</p>
        <br />
        <br />
        <a style="border-radius: 6px; color: #fff; text-decoration: none; font-weight: 500; padding: 12px; background-color: #1F2128;" href="${link}">Verify my email address!</a>
      </div>
    </div>`,
  }
}

export const temporaryPassword = (
  link: string,
  firstName: string,
  userName: string,
  codeParam: string,
): CustomMessageReturnValue => {
  return {
    emailSubject: `Your temporary credentials! 🔥`,
    emailMessage: `
    <div>
      <div>
        <h1>Hi ${_.startCase(_.camelCase(firstName))} 👋</h1>
        <p>It looks like an adminstrator has created you some temporary credentaisl!</p>
        <p>Your username is ${userName}.</p>
        <p>Your temporay password is ${codeParam}</p>
        <br />
        <p>You can use these credentials to log in at the link below.</p>
        <br />
        <a style="border-radius: 6px; color: #fff; text-decoration: none; font-weight: 500; padding: 12px; background-color: #1F2128;" href="${link}">Login!</a>
      </div>
    </div>`,
  }
}
