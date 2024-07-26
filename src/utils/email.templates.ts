export const inviteTemplate = (
  name: string,
  link: string,
  btn_text: string,
) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html data-editor-version="2" class="sg-campaigns">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"
    />
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <style type="text/css">
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff !important;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border: 1px solid rgb(26, 61, 251) !important;
      }
      .logo {
        text-align: center;
        margin-bottom: 20px;
      }
      .logo img {
        max-width: 200px;
        height: auto;
      }
      .greetings {
        text-align: center;
        margin-bottom: 20px;
      }
      .invitation-message {
        margin-bottom: 20px;
        padding: 20px;
        background-color: rgba(123, 114, 234, 0.15);
        border-radius: 5px;
        border-left: 5px solid rgb(26, 61, 251);
      }
      .btn {
        display: inline-block;
        padding: 10px 20px;
        background-color: rgb(26, 61, 251) !important;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 5px;
      }
      .btn:hover {
        background-color: rgba(123, 114, 234, 0.5) !important; /* Adjusted for clarity */
        color: #000 !important;
      }
      p {
        font-size: 16px;
        text-align: center;
        line-height: 24px;
      }
    </style>
  </head>
  <body>
    <div class="container" style="margin: 8px auto">
      <div class="logo">
        <img
          src="https://lockroom-fr-staging.vercel.app/static/logo%20(1).png"
          alt="LockRoom Logo"
        />
      </div>
      <div class="greetings"></div>
      <div class="invitation-message">
        <p>
          You've been invited to LockRoom by ${name}. Click
          <a href=${link} style="color: rgb(26, 61, 251); text-decoration: none"
            >${btn_text}</a
          >
          to get started.
        </p>
      </div>
    </div>
  </body>
</html>
`;
export const signupTemplate = (
  link: string,
) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html data-editor-version="2" class="sg-campaigns">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"
    />
    <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
    <style type="text/css">
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff !important;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border: 1px solid rgb(26, 61, 251) !important;
      }
      .logo {
        text-align: center;
        margin-bottom: 20px;
      }
      .logo img {
        max-width: 200px;
        height: auto;
      }
      .greetings {
        text-align: center;
        margin-bottom: 20px;
      }
      .invitation-message {
        margin-bottom: 20px;
        padding: 20px;
        background-color: rgba(123, 114, 234, 0.15);
        border-radius: 5px;
        border-left: 5px solid rgb(26, 61, 251);
      }
      .btn {
        display: inline-block;
        padding: 10px 20px;
        background-color: rgb(26, 61, 251) !important;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 5px;
      }
      .btn:hover {
        background-color: rgba(123, 114, 234, 0.5) !important; /* Adjusted for clarity */
        color: #000 !important;
      }
      p {
        font-size: 16px;
        text-align: center;
        line-height: 24px;
      }
    </style>
  </head>
  <body>
    <div class="container" style="margin: 8px auto">
      <div class="logo">
        <img
          src="https://lockroom-fr-staging.vercel.app/static/logo%20(1).png"
          alt="LockRoom Logo"
        />
      </div>
      <div class="greetings"></div>
      <div class="invitation-message">
        <p>
          <a href=${link} style="color: rgb(26, 61, 251); text-decoration: none"
            >Confirm Password</a
          >
          to get started.
        </p>
      </div>
    </div>
  </body>
</html>
`;
