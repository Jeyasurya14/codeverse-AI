# Data Safety Form Guide for Google Play Console

This guide will help you accurately fill out the Data Safety form for CodeVerse.

## Overview

CodeVerse collects and shares user data for:
- **Account management** (email, name, password)
- **Learning features** (progress tracking, bookmarks, articles read)
- **AI mentor functionality** (conversations sent to OpenAI)
- **Security** (login attempts, device info)

---

## Step 1: Overview

**Question: "Does your app collect or share any of the required user data types?"**

**Answer: YES** ✅

Your app collects:
- Personal information (email, name)
- App activity (conversations, progress, bookmarks)
- Device information (OS, device type)

---

## Step 2: Data Collection and Security

### Does your app collect data?

**Answer: YES** ✅

### Does your app share data with third parties?

**Answer: YES** ✅

You share data with:
- **OpenAI** (for AI mentor responses)
- **Backend hosting provider** (for data storage)

### Encryption

**Question: "Is all user data encrypted in transit?"**

**Answer: YES** ✅

(Your backend uses HTTPS, and API calls are encrypted)

**Question: "Is all user data encrypted at rest?"**

**Answer: YES** ✅

(Your database stores encrypted/hashed passwords and data is stored securely)

---

## Step 3: Data Types - What to Disclose

### ✅ **Personal Information**

#### **Email address**
- **Collected:** YES
- **Purpose:** Account creation, login, communication
- **Required or optional:** Required
- **Shared:** YES (with backend hosting provider)
- **Ephemeral:** NO

#### **Name**
- **Collected:** YES
- **Purpose:** Account personalization
- **Required or optional:** Optional (can be skipped during registration)
- **Shared:** YES (with backend hosting provider)
- **Ephemeral:** NO

### ✅ **App Activity**

#### **App interactions**
- **Collected:** YES
- **Purpose:** Track learning progress, articles read, bookmarks
- **Required or optional:** Required for app functionality
- **Shared:** YES (with backend hosting provider)
- **Ephemeral:** NO

#### **Other user-generated content**
- **Collected:** YES
- **Purpose:** AI conversations/queries sent to mentor
- **Required or optional:** Required for AI mentor feature
- **Shared:** YES (with OpenAI and backend hosting provider)
- **Ephemeral:** NO

### ✅ **Device or Other IDs**

#### **Device or other IDs**
- **Collected:** YES (automatically by React Native/Expo)
- **Purpose:** App functionality, security (login tracking)
- **Required or optional:** Required (automatic)
- **Shared:** YES (with backend hosting provider)
- **Ephemeral:** NO

---

## Step 4: Data Usage and Handling

### For each data type you disclosed, you'll need to specify:

#### **Purpose:**
- Account management
- App functionality
- Analytics (for improving the service)
- Personalization
- Developer communications (if you send emails)

#### **Data retention:**
- **How long is user data retained?**
  - **Answer:** "Until user deletes account" or "Until user requests deletion"
  - You can also specify: "Indefinitely, until user requests deletion"

#### **Is this data required for your app to function?**
- **Email:** YES (required)
- **Name:** NO (optional)
- **App interactions:** YES (required)
- **AI conversations:** YES (required for AI mentor)
- **Device IDs:** YES (automatic, required)

#### **Can users request deletion?**
- **Answer: YES** ✅
- (You should have a way for users to delete their account/data)

---

## Step 5: Third-Party Sharing

### OpenAI

**What data is shared?**
- AI conversation queries/messages
- User context (for personalized responses)

**Purpose:**
- App functionality (AI mentor feature)

**Is this data collection optional?**
- NO (required for AI mentor to work)

### Backend Hosting Provider

**What data is shared?**
- All user data (email, name, progress, conversations, tokens, etc.)

**Purpose:**
- Data storage and app functionality

**Is this data collection optional?**
- NO (required for app to function)

---

## Important Notes

1. **Local Storage (AsyncStorage):**
   - Data stored locally on the device (bookmarks, progress, tokens) is also transmitted to your backend
   - This counts as "collected" data

2. **Ephemeral Processing:**
   - If you process any data only in memory without storing it, you can mark it as "ephemeral"
   - However, CodeVerse stores most data, so most items should be marked as NOT ephemeral

3. **Children's Data:**
   - Since your app targets users 9+, you've already disclosed this in the Content Rating section
   - The Data Safety form will automatically reflect this

4. **Security Practices:**
   - Mention that passwords are hashed (bcrypt)
   - Mention HTTPS encryption
   - Mention account lockout after failed login attempts

---

## Quick Checklist

Before submitting, verify:

- [ ] All collected data types are disclosed
- [ ] All third-party sharing is disclosed (OpenAI, hosting provider)
- [ ] Encryption is marked as YES for both in-transit and at-rest
- [ ] Data retention policy is specified
- [ ] User deletion rights are mentioned
- [ ] All required data is marked as "required"
- [ ] Optional data (like name) is marked as "optional"

---

## Next Steps

1. Click **"Next"** on the overview screen
2. Answer **"YES"** to data collection and sharing
3. Go through each data type and fill in the details above
4. Review the preview before submitting
5. Submit the form

---

## Need Help?

If Google Play asks for clarification:
- Refer to your privacy policy at: `privacy-policy/index.html`
- Be consistent with what you stated in the Content Rating questionnaire
- If unsure about a specific data type, err on the side of disclosure
