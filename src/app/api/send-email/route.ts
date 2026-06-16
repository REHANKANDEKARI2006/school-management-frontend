import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { to, subject, html, secret } = await request.json();

    // Verify shared secret to prevent abuse
    const bridgeSecret = process.env.EMAIL_BRIDGE_SECRET;
    if (!bridgeSecret || secret !== bridgeSecret) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: parseInt(process.env.EMAIL_PORT || "587") === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"CampusConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    console.log(`[Email Bridge] Sending email to ${to} via Gmail SMTP...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Bridge] Email sent successfully: ${info.messageId}`);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("[Email Bridge] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
