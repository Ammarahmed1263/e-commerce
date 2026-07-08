import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  console.log(
    "falling to simulation: ",
    !process.env.RESEND_API_KEY,
  );
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n📧 [EMAIL SIMULATION] To: ${options.to} | Subject: ${options.subject}`,
    );
    console.log(`[BODY]\n${options.html}\n`);
    return;
  }

  try {
    await resend.emails.send({
      from: options.from || process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

export const sendWelcomeEmail = async (user) => {
  const html = `
    <h1>Welcome to Luxora, ${user.firstName}!</h1>
    <p>We are thrilled to have you on board.</p>
    <p>Enjoy your shopping experience!</p>
  `;
  await sendEmail({
    from: process.env.EMAIL_FROM || "noreply@luxora.com",
    to: user.email,
    subject: "Welcome to Luxora!",
    html,
  });
};

export const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  const html = `
    <h1>Email Verification</h1>
    <p>Hi ${user.firstName}, please verify your email address by clicking the link below:</p>
    <a href="${url}">Verify Email</a>
  `;
  await sendEmail({
    from: process.env.EMAIL_FROM || "noreply@luxora.com",
    to: user.email,
    subject: "Verify your Luxora Account",
    html,
  });
};

export const sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = `
    <h1>Password Reset Request</h1>
    <p>Hi ${user.firstName}, we received a request to reset your password. Click the link below to set a new password:</p>
    <a href="${url}">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
  `;
  await sendEmail({
    from: process.env.EMAIL_FROM || "noreply@luxora.com",
    to: user.email,
    subject: "Password Reset - Luxora",
    html,
  });
};

export const sendOrderConfirmationEmail = async (user, order) => {
  const html = `
    <h1>Order Confirmation</h1>
    <p>Hi ${user.firstName}, thank you for your order!</p>
    <p>Order Number: <strong>${order.orderNumber}</strong></p>
    <p>Total: $${order.summary.total.toFixed(2)}</p>
    <p>We will notify you when your order ships.</p>
  `;
  await sendEmail({
    from: process.env.EMAIL_FROM || "noreply@luxora.com",
    to: user.email,
    subject: `Order Confirmation ${order.orderNumber}`,
    html,
  });
};

export const sendOrderShippedEmail = async (user, order) => {
  const html = `
    <h1>Your order has shipped!</h1>
    <p>Hi ${user.firstName}, your order ${order.orderNumber} is on its way.</p>
    ${order.trackingNumber ? `<p>Tracking Number: <strong>${order.trackingNumber}</strong> (${order.carrier || "Standard Shipping"})</p>` : ""}
  `;
  await sendEmail({
    from: process.env.EMAIL_FROM || "noreply@luxora.com",
    to: user.email,
    subject: `Your Luxora Order ${order.orderNumber} has shipped`,
    html,
  });
};

export const sendOrderDeliveredEmail = async (user, order) => {
  const html = `
    <h1>Order Delivered</h1>
    <p>Hi ${user.firstName}, your order ${order.orderNumber} has been delivered.</p>
    <p>We hope you love your items! If you have a moment, please consider leaving a review.</p>
  `;
  await sendEmail({
    from: process.env.EMAIL_FROM || "noreply@luxora.com",
    to: user.email,
    subject: `Order Delivered: ${order.orderNumber}`,
    html,
  });
};
