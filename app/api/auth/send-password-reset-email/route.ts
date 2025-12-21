import { NextResponse, NextRequest } from "next/server";
import nodemailer from "nodemailer";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, resetToken, language } = body;

    if (!email || !resetToken) {
      return NextResponse.json(
        { error: "Email and reset token are required" },
        { status: 400 }
      );
    }

    // Fetch organization data including SMTP settings
    // Priority: 1. Environment variables (if set), 2. Organization API (if it has SMTP), 3. Fallback to env vars
    let organization: any = {};

    // Check if SMTP is in environment variables (highest priority)
    const hasSmtpInEnv =
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD;

    // Try to fetch from organization API for additional data (name, email, language, etc.)
    let apiOrganization: any = null;
    try {
      // Use the public organization endpoint (no authentication required)
      const organizationId =
        process.env.ORGANIZATION_ID || process.env.TENANT_ORGANIZATION_ID;

      const tenantBeUrl =
        process.env.TENANT_ADMIN_URL || "http://localhost:3001";
      const publicOrgUrl = organizationId
        ? `${tenantBeUrl}/api/organization/public?organizationId=${organizationId}`
        : `${tenantBeUrl}/api/organization/public`;

      console.log("Fetching organization from public endpoint:", publicOrgUrl);

      const orgResponse = await fetch(publicOrgUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (orgResponse.ok) {
        apiOrganization = await orgResponse.json();
        console.log("Organization data fetched from public endpoint:", {
          hasSmtpHost: !!apiOrganization.smtpHost,
          hasSmtpUser: !!apiOrganization.smtpUser,
          hasName: !!apiOrganization.name,
        });
      } else {
        console.warn(
          "Public organization endpoint returned:",
          orgResponse.status
        );
      }
    } catch (error) {
      console.warn("Error fetching organization from public API:", error);
    }

    // Check if API returned organization with SMTP settings
    const hasSmtpInApi =
      apiOrganization &&
      apiOrganization.smtpHost &&
      apiOrganization.smtpUser &&
      apiOrganization.smtpPassword;

    // Build organization object: prioritize SMTP from env vars, but use API for other fields
    if (hasSmtpInEnv) {
      console.log("Using SMTP settings from environment variables");
      organization = {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || "587"),
        smtpUser: process.env.SMTP_USER,
        smtpPassword: process.env.SMTP_PASSWORD,
        smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER,
        name:
          apiOrganization?.name ||
          process.env.ORGANIZATION_NAME ||
          "Spin8 Studio",
        email:
          apiOrganization?.email ||
          process.env.ORGANIZATION_EMAIL ||
          process.env.SMTP_FROM ||
          process.env.SMTP_USER,
        language:
          apiOrganization?.language ||
          process.env.ORGANIZATION_LANGUAGE ||
          "en",
        ...apiOrganization, // Merge any other fields from API
      };
    } else if (hasSmtpInApi) {
      console.log("Using SMTP settings from organization API");
      organization = apiOrganization;
    } else if (apiOrganization) {
      // API returned data but no SMTP - use API data for name/email but warn about SMTP
      console.warn(
        "Organization API returned data but no SMTP settings. SMTP environment variables are also not set. Email will not be sent."
      );
      organization = apiOrganization;
    } else {
      // No API data and no env vars - use defaults
      console.warn(
        "No organization data available from API and no SMTP environment variables set. Email will not be sent."
      );
      organization = {
        name: process.env.ORGANIZATION_NAME || "Spin8 Studio",
        email: process.env.ORGANIZATION_EMAIL || process.env.SMTP_FROM || "",
        language: process.env.ORGANIZATION_LANGUAGE || "en",
      };
    }

    // Get SMTP settings from organization
    const smtpHost =
      organization.smtpHost ||
      organization.smtp_host ||
      organization.emailHost ||
      organization.email_host;
    const smtpPort =
      organization.smtpPort ||
      organization.smtp_port ||
      organization.emailPort ||
      organization.email_port ||
      587;
    const smtpUser =
      organization.smtpUser ||
      organization.smtp_user ||
      organization.emailUser ||
      organization.email_user;
    const smtpPassword =
      organization.smtpPassword ||
      organization.smtp_password ||
      organization.emailPassword ||
      organization.email_password;
    const smtpFrom =
      organization.smtpFromEmail ||
      organization.smtpFrom ||
      organization.smtp_from ||
      organization.emailFrom ||
      organization.email_from ||
      smtpUser;
    const orgName =
      organization.smtpFromName || organization.name || "Spin8 Studio";
    const orgEmail = organization.email || smtpFrom;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.warn(
        "SMTP settings not configured in organization - email will not be sent",
        {
          smtpHost: !!smtpHost,
          smtpUser: !!smtpUser,
          smtpPassword: !!smtpPassword,
          organizationKeys: Object.keys(organization),
        }
      );
      return NextResponse.json(
        {
          error: "Email service not configured",
          warning: true,
          message:
            "Password reset email could not be sent due to missing SMTP configuration",
        },
        { status: 200 } // Return 200 so request doesn't fail
      );
    }

    // Determine language for email template
    const emailLanguage = language || organization.language || "en";

    // Create password reset link - redirects to password creation page
    const baseUrl =
      process.env.TENANT_FE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/reset-password?token_hash=${resetToken}&type=recovery`;

    // Email templates
    const emailTemplates = {
      en: {
        subject: `Reset Your Password - ${orgName}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Reset Your Password</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${
      name || "there"
    },</p>
    <p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset your password for your ${orgName} account.</p>
    <p style="font-size: 16px; margin-bottom: 30px;">Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">Reset Password</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all; margin-top: 10px;">${resetLink}</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This link will expire in 1 hour.</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you didn't request a password reset, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} ${orgName}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
        text: `
Reset Your Password - ${orgName}

Hello ${name || "there"},

We received a request to reset your password for your ${orgName} account.

Click the link below to create a new password:
${resetLink}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

© ${new Date().getFullYear()} ${orgName}. All rights reserved.
        `,
      },
      tr: {
        subject: `Şifrenizi Sıfırlayın - ${orgName}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Şifrenizi Sıfırlayın</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Şifrenizi Sıfırlayın</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Merhaba ${
      name || "değerli kullanıcı"
    },</p>
    <p style="font-size: 16px; margin-bottom: 20px;">${orgName} hesabınız için şifre sıfırlama talebi aldık.</p>
    <p style="font-size: 16px; margin-bottom: 30px;">Yeni bir şifre oluşturmak için aşağıdaki butona tıklayın:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">Şifreyi Sıfırla</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Buton çalışmıyorsa, bu bağlantıyı tarayıcınıza kopyalayıp yapıştırın:</p>
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all; margin-top: 10px;">${resetLink}</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Bu bağlantı 1 saat içinde geçersiz olacaktır.</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">Eğer şifre sıfırlama talebinde bulunmadıysanız, lütfen bu e-postayı yok sayın.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} ${orgName}. Tüm hakları saklıdır.</p>
  </div>
</body>
</html>
        `,
        text: `
Şifrenizi Sıfırlayın - ${orgName}

Merhaba ${name || "değerli kullanıcı"},

${orgName} hesabınız için şifre sıfırlama talebi aldık.

Yeni bir şifre oluşturmak için bu bağlantıyı ziyaret edin:
${resetLink}

Bu bağlantı 1 saat içinde geçersiz olacaktır.

Eğer şifre sıfırlama talebinde bulunmadıysanız, lütfen bu e-postayı yok sayın.

© ${new Date().getFullYear()} ${orgName}. Tüm hakları saklıdır.
        `,
      },
    };

    const template =
      emailTemplates[emailLanguage as keyof typeof emailTemplates] ||
      emailTemplates.en;

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"${orgName}" <${smtpFrom}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send password reset email" },
      { status: 500 }
    );
  }
}

