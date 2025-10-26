export const confirmationEmailTemplate = (login, confirmUrl) => `
<!DOCTYPE html>
<html lang="uk">
  <body style="font-family: 'Segoe UI', Arial, sans-serif; background:#E6E1DD; padding:40px; margin:0;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:auto;">
      <tr>
        <td align="center">
          <table width="100%" style="background:#ffffff; border-radius:14px; padding:40px; text-align:center; box-shadow:0 4px 16px rgba(0,0,0,0.05);">
            <tr>
              <td>
                <h2 style="color:#4E1E4A; font-size:24px; margin-bottom:16px;">
                  Підтвердіть свою електронну адресу, ${login}
                </h2>

                <p style="color:#5b4c56; font-size:16px; line-height:1.6; margin-bottom:30px;">
                  Дякуємо за реєстрацію в <b style="color:#864D7F;">USOF</b>! <br/>
                  Будь ласка, підтвердіть свою електронну адресу, щоб активувати обліковий запис.
                </p>

                <a href="${confirmUrl}" style="
                  display:inline-block;
                  background:#4E1E4A;
                  color:#fff;
                  padding:12px 32px;
                  border-radius:30px;
                  text-decoration:none;
                  font-weight:bold;
                  letter-spacing:0.5px;
                  transition:background 0.3s ease;">
                  Підтвердити пошту
                </a>

                <p style="margin-top:28px; color:#9b8b92; font-size:13px; line-height:1.4;">
                  Якщо ви не створювали цей обліковий запис, просто ігноруйте цей лист.
                </p>

                <hr style="border:none; border-top:1px solid #DECBc3; margin:35px 0;">
                <p style="font-size:12px; color:#C9ABC3;">© 2025 USOF Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const passwordResetTemplate = (login, resetUrl) => `
<!DOCTYPE html>
<html lang="uk">
  <body style="font-family: 'Segoe UI', Arial, sans-serif; background:#E6E1DD; padding:40px; margin:0;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:auto;">
      <tr>
        <td align="center">
          <table width="100%" style="background:#ffffff; border-radius:14px; padding:40px; text-align:center; box-shadow:0 4px 16px rgba(0,0,0,0.05);">
            <tr>
              <td>
                <h2 style="color:#4E1E4A; font-size:24px; margin-bottom:16px;">
                  Відновлення пароля для ${login}
                </h2>

                <p style="color:#5b4c56; font-size:16px; line-height:1.6; margin-bottom:30px;">
                  Ми отримали запит на зміну пароля. Натисніть кнопку нижче, щоб створити новий пароль.
                </p>

                <a href="${resetUrl}" style="
                  display:inline-block;
                  background:#864D7F;
                  color:#fff;
                  padding:12px 32px;
                  border-radius:30px;
                  text-decoration:none;
                  font-weight:bold;
                  letter-spacing:0.5px;
                  transition:background 0.3s ease;">
                  Встановити новий пароль
                </a>

                <p style="margin-top:28px; color:#9b8b92; font-size:13px; line-height:1.4;">
                  Якщо ви не надсилали цей запит, просто ігноруйте цей лист.
                </p>

                <hr style="border:none; border-top:1px solid #DECBc3; margin:35px 0;">
                <p style="font-size:12px; color:#C9ABC3;">© 2025 USOF Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
