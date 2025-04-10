# Setting Up SMTP in Supabase for Email Delivery

This guide will help you set up SMTP in your Supabase project to enable actual email delivery for magic links and password resets.

## Option 1: Using Mailtrap (Recommended for Testing)

[Mailtrap](https://mailtrap.io/) is a testing tool that lets you test email sending without actually delivering emails to real inboxes. It's perfect for development and testing.

### Step 1: Create a Mailtrap Account

1. Go to [Mailtrap.io](https://mailtrap.io/) and sign up for a free account
2. Create a new inbox or use the default one

### Step 2: Get SMTP Credentials

1. In your Mailtrap inbox, click on "SMTP Settings"
2. Select "Nodemailer" from the integrations dropdown
3. Copy the SMTP credentials:
   - Host: smtp.mailtrap.io
   - Port: 2525 (or 587 for TLS)
   - Username: (provided by Mailtrap)
   - Password: (provided by Mailtrap)

### Step 3: Configure Supabase SMTP

1. Go to your Supabase dashboard
2. Navigate to Authentication > Email Templates
3. Click on the "Email Settings" tab
4. Enable "Custom SMTP"
5. Enter your Mailtrap SMTP credentials:
   - Sender Name: Your App Name
   - Sender Email: noreply@yourdomain.com (can be any email for testing)
   - Host: smtp.mailtrap.io
   - Port: 2525 (or 587 for TLS)
   - Username: (from Mailtrap)
   - Password: (from Mailtrap)
   - Enable TLS: Yes (if using port 587)
6. Click "Save"

### Step 4: Test Email Delivery

1. Go to your application
2. Navigate to the sign-in page
3. Use the magic link option with your email
4. Check your Mailtrap inbox for the magic link email

## Option 2: Using SendGrid (For Production)

[SendGrid](https://sendgrid.com/) is a reliable email delivery service with a free tier that allows sending up to 100 emails per day.

### Step 1: Create a SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com/) and sign up for a free account
2. Verify your account and complete the setup

### Step 2: Create an API Key

1. In your SendGrid dashboard, go to Settings > API Keys
2. Click "Create API Key"
3. Name your API key (e.g., "Supabase Integration")
4. Select "Restricted Access" and enable "Mail Send" permissions
5. Click "Create & View"
6. Copy the API key (you won't be able to see it again)

### Step 3: Set Up Sender Authentication

1. Go to Settings > Sender Authentication
2. Choose either Domain Authentication or Single Sender Verification
3. Follow the steps to verify your domain or email address

### Step 4: Get SMTP Credentials

SendGrid SMTP credentials:
- Host: smtp.sendgrid.net
- Port: 587
- Username: apikey
- Password: (your API key)

### Step 5: Configure Supabase SMTP

1. Go to your Supabase dashboard
2. Navigate to Authentication > Email Templates
3. Click on the "Email Settings" tab
4. Enable "Custom SMTP"
5. Enter your SendGrid SMTP credentials:
   - Sender Name: Your App Name
   - Sender Email: (your verified email address)
   - Host: smtp.sendgrid.net
   - Port: 587
   - Username: apikey
   - Password: (your API key)
   - Enable TLS: Yes
6. Click "Save"

### Step 6: Test Email Delivery

1. Go to your application
2. Navigate to the sign-in page
3. Use the magic link option with your email
4. Check your email inbox for the magic link email

## Customizing Email Templates

While you're in the Email Templates section, you can also customize the email templates:

1. Go to the "Templates" tab
2. Select the template you want to customize from the dropdown:
   - Confirmation
   - Invitation
   - Magic Link
   - Reset Password
3. Customize the template as needed
4. Click "Save"

## Troubleshooting

If you're not receiving emails:

1. Check your spam folder
2. Verify that your SMTP credentials are correct
3. Check the Supabase logs for any errors
4. Try using a different email address
5. Make sure your sender email is verified (for production environments)

For Mailtrap, check your Mailtrap inbox instead of your actual email inbox.
