import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, confirmationToken, language } = body;

    if (!email || !confirmationToken) {
      return NextResponse.json(
        { error: "Email and confirmation token are required" },
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

    // Log organization data to debug SMTP settings
    console.log("Organization data received:", {
      hasSmtpHost: !!organization.smtpHost,
      hasSmtpUser: !!organization.smtpUser,
      hasSmtpPassword: !!organization.smtpPassword,
      keys: Object.keys(organization),
    });

    // Get SMTP settings from organization - match tenant backend structure
    // Tenant backend expects: smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromEmail, smtpFromName
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
      // Don't fail - registration was successful, email sending is optional
      return NextResponse.json(
        {
          error: "Email service not configured",
          warning: true,
          message:
            "User registered successfully but confirmation email could not be sent due to missing SMTP configuration",
        },
        { status: 200 } // Return 200 so registration doesn't fail
      );
    }

    // Determine language for email template
    const emailLanguage = language || organization.language || "en";

    // Create confirmation link
    const baseUrl =
      process.env.TENANT_FE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    const confirmationLink = `${baseUrl}/auth/activate?token_hash=${confirmationToken}&type=signup`;

    // Email templates
    const emailTemplates = {
      en: {
        subject: `Welcome to ${orgName} - Confirm Your Email`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to ${orgName}</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${
      name || "there"
    },</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Thank you for registering with ${orgName}!</p>
    <p style="font-size: 16px; margin-bottom: 30px;">Please confirm your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationLink}" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">Confirm Email Address</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all; margin-top: 10px;">${confirmationLink}</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This link will expire in 24 hours.</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you didn't create an account, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} ${orgName}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
        text: `
Welcome to ${orgName}

Hello ${name || "there"},

Thank you for registering with ${orgName}!

Please confirm your email address by visiting this link:
${confirmationLink}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

© ${new Date().getFullYear()} ${orgName}. All rights reserved.
        `,
      },
      tr: {
        subject: `${orgName} - E-posta Adresinizi Onaylayın`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-posta Adresinizi Onaylayın</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">${orgName}'ye Hoş Geldiniz</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Merhaba ${
      name || "değerli kullanıcı"
    },</p>
    <p style="font-size: 16px; margin-bottom: 20px;">${orgName}'ye kayıt olduğunuz için teşekkür ederiz!</p>
    <p style="font-size: 16px; margin-bottom: 30px;">Lütfen e-posta adresinizi onaylamak için aşağıdaki butona tıklayın:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationLink}" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">E-posta Adresini Onayla</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Buton çalışmıyorsa, bu bağlantıyı tarayıcınıza kopyalayıp yapıştırın:</p>
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all; margin-top: 10px;">${confirmationLink}</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Bu bağlantı 24 saat içinde geçersiz olacaktır.</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">Eğer bir hesap oluşturmadıysanız, lütfen bu e-postayı yok sayın.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} ${orgName}. Tüm hakları saklıdır.</p>
  </div>
</body>
</html>
        `,
        text: `
${orgName}'ye Hoş Geldiniz

Merhaba ${name || "değerli kullanıcı"},

${orgName}'ye kayıt olduğunuz için teşekkür ederiz!

Lütfen e-posta adresinizi onaylamak için bu bağlantıyı ziyaret edin:
${confirmationLink}

Bu bağlantı 24 saat içinde geçersiz olacaktır.

Eğer bir hesap oluşturmadıysanız, lütfen bu e-postayı yok sayın.

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
    console.error("Error sending confirmation email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send confirmation email" },
      { status: 500 }
    );
  }
}

