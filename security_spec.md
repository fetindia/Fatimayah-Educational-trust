# FET India Security Specification & Threat Model
**System Legal Entity:** Fatimyah Educational Trust (FET India)  
**Security Standard:** Zero-Trust Attribute-Based Access Control (ABAC) with Eight Pillars of Firestore Hardening  
**Target Database:** `ai-studio-fetindiafatimyah-ae91547c-059f-489b-952f-82301b70763c`  
**Super Administrator Root:** `fetkofficial@gmail.com`

---

## 1. Core Data Invariants & Authorization Boundaries

1. **Root Super Admin Immunity & Sovereign Authority**:
   - The designated root email (`fetkofficial@gmail.com` with `email_verified == true`) possesses immutable governance authority.
   - Normal users or unauthorized callers can NEVER elevate themselves, assign roles, grant custom permissions, or tamper with system logs.

2. **Self-Promotion & Role Tampering Guard**:
   - Public registrants are strictly initialized with the default `user` role (`accountType: 'user'`, `membershipStatus: 'none'`).
   - On document update (`users/{userId}`), normal authenticated users can modify standard contact/bio/profile completion fields ONLY. They are strictly prohibited from touching:
     `roles`, `primaryRole`, `role`, `accountType`, `permissions`, `customPermissions`, `status`, `accountStatus`, `uid`, `email`, `membershipStatus`, `volunteerStatus`, `donorStatus`, `membershipId`, `volunteerId`, `donorId`, `promotedAt`, `promotedBy`, `promotedByEmail`, `promotionNote`.

3. **PII Isolation & Secure Reads**:
   - Private user profile data (mobile number, physical street address, emergency contact, date of birth) in `/users/{userId}` is strictly restricted to document owner (`request.auth.uid == userId`) and authorized administrators.
   - Public accreditation endpoints (`/public_memberships/{id}`, `/public_donors/{id}`, `/public_volunteers/{id}`, `/public_staff/{id}`, `/public_certificates/{id}`) expose only sanitized verification attributes (Name, Status, Issue Date, Validity) without leaking sensitive contact or financial details.

4. **Immutable Append-Only Audit Logs**:
   - System audit trails in `/audit_logs/{logId}` are strictly append-only by authenticated actors. Modifications (`update`) and deletions (`delete`) are blocked unconditionally (`allow update, delete: if false;`).

5. **Financial & Ledger Integrity**:
   - Trust income ledgers, school fee collections, and expense vouchers in `/financial_records/{recordId}` are strictly writable by authorized finance administrators (`hasAdminRole()`). Standard users can only view their own receipts. Deletion is restricted to Super Admin.

6. **Crowdfunding Appeal & Donation Protection**:
   - Members can draft or submit campaigns with initial status `draft` or `pending_review` with `raisedAmount == 0` and `verifiedDonationsCount == 0`.
   - Campaign creator cannot alter approval status, verified flags, or raise totals.
   - Donation pledges (`/campaign_donations/{donationId}`) require administrative verification before campaign progress can be accredited.

7. **Application Intake & Review Flow**:
   - Application intakes (`membershipApplications`, `volunteerApplications`, `donorApplications`) are created by authenticated members with initial status `pending`.
   - Applicants can only update non-administrative fields while in `pending` status.
   - Status transitions (`under_review`, `approved`, `rejected`), ID allocations, and review notes are restricted to administrators.

8. **Examinations & Talent Search Competitions**:
   - Competition test attempts (`/exam_attempts/{attemptId}`) and registrations (`/competition_registrations/{registrationId}`) prevent participants from scoring or publishing their own results.
   - Certificates (`/competition_certificates/{certId}`) are issued exclusively by administrators.

---

## 2. The "Dirty Dozen" Threat Payloads (Payload-First TDD)

The following 12 adversarial JSON payloads are designed to challenge identity, integrity, and authorization invariants. All 12 MUST return `PERMISSION_DENIED`.

### Payload 1: Privilege Escalation (Self-Assign Super Admin)
```json
{
  "targetCollection": "users",
  "targetDocId": "unprivileged_user_123",
  "actorAuth": { "uid": "unprivileged_user_123", "token": { "email": "attacker@example.com", "email_verified": true } },
  "operation": "update",
  "data": {
    "roles": ["super_admin", "administrator"],
    "primaryRole": "super_admin",
    "accountType": "admin"
  },
  "expectedResult": "PERMISSION_DENIED"
}
```

### Payload 2: Ghost Super Admin Create Spoofing
```json
{
  "targetCollection": "users",
  "targetDocId": "attacker_456",
  "actorAuth": { "uid": "attacker_456", "token": { "email": "attacker@example.com", "email_verified": true } },
  "operation": "create",
  "data": {
    "uid": "attacker_456",
    "email": "attacker@example.com",
    "roles": ["super_admin"],
    "primaryRole": "super_admin",
    "status": "active"
  },
  "expectedResult": "PERMISSION_DENIED (Must default to user role)"
}
```

### Payload 3: Audit Trail Tampering / Deletion
```json
{
  "targetCollection": "audit_logs",
  "targetDocId": "log_abc_123",
  "actorAuth": { "uid": "rogue_admin_789", "token": { "email": "rogue@example.com", "email_verified": true } },
  "operation": "delete",
  "data": {},
  "expectedResult": "PERMISSION_DENIED (Audit logs are permanently immutable)"
}
```

### Payload 4: Arbitrary User Profile Snooping (PII Breach)
```json
{
  "targetCollection": "users",
  "targetDocId": "victim_uid_999",
  "actorAuth": { "uid": "unauthorized_user_111", "token": { "email": "viewer@example.com", "email_verified": true } },
  "operation": "get",
  "data": {},
  "expectedResult": "PERMISSION_DENIED"
}
```

### Payload 5: Campaign Creator Self-Verification & Raised Amount Inflation
```json
{
  "targetCollection": "crowdfunding_campaigns",
  "targetDocId": "camp_555",
  "actorAuth": { "uid": "creator_222", "token": { "email": "creator@example.com", "email_verified": true } },
  "operation": "update",
  "data": {
    "status": "active",
    "isVerifiedByFET": true,
    "raisedAmount": 500000,
    "verifiedDonationsCount": 100
  },
  "expectedResult": "PERMISSION_DENIED"
}
```

### Payload 6: Unverified Email Admin Claim Spoof
```json
{
  "targetCollection": "organization_config",
  "targetDocId": "main_config",
  "actorAuth": { "uid": "spoofed_uid_333", "token": { "email": "fetkofficial@gmail.com", "email_verified": false } },
  "operation": "update",
  "data": {
    "displayName": "Hacked Entity"
  },
  "expectedResult": "PERMISSION_DENIED (Must require email_verified == true)"
}
```

### Payload 7: Financial Record Creation by Unprivileged User
```json
{
  "targetCollection": "financial_records",
  "targetDocId": "fin_rec_777",
  "actorAuth": { "uid": "general_user_444", "token": { "email": "user@example.com", "email_verified": true } },
  "operation": "create",
  "data": {
    "transactionId": "FET-EXP-2026-999999",
    "type": "expense",
    "amount": 250000,
    "status": "approved",
    "payerPayeeName": "Attacker"
  },
  "expectedResult": "PERMISSION_DENIED"
}
```

### Payload 8: Membership Application Status Self-Approval
```json
{
  "targetCollection": "membershipApplications",
  "targetDocId": "app_888",
  "actorAuth": { "uid": "applicant_555", "token": { "email": "applicant@example.com", "email_verified": true } },
  "operation": "update",
  "data": {
    "status": "approved",
    "membershipIdAssigned": "FET-MBR-2026-0001",
    "approvedBy": "applicant_555"
  },
  "expectedResult": "PERMISSION_DENIED"
}
```

### Payload 9: Exam Registration Score & Rank Forgery
```json
{
  "targetCollection": "competition_registrations",
  "targetDocId": "reg_333",
  "actorAuth": { "uid": "student_666", "token": { "email": "student@example.com", "email_verified": true } },
  "operation": "update",
  "data": {
    "marksObtained": 100,
    "totalMarks": 100,
    "percentage": 100,
    "rank": 1,
    "isResultPublished": true
  },
  "expectedResult": "PERMISSION_DENIED"
}
```

### Payload 10: In-App User Notification Hijack / Injection
```json
{
  "targetCollection": "user_notifications",
  "targetDocId": "notif_999",
  "actorAuth": { "uid": "attacker_777", "token": { "email": "attacker@example.com", "email_verified": true } },
  "operation": "create",
  "data": {
    "userId": "victim_uid_888",
    "title": "Phishing Alert",
    "message": "Click here to submit password"
  },
  "expectedResult": "PERMISSION_DENIED (Non-admin cannot create notifications for other users)"
}
```

### Payload 11: Direct Donation Verification Forgery
```json
{
  "targetCollection": "campaign_donations",
  "targetDocId": "don_111",
  "actorAuth": { "uid": "donor_user_888", "token": { "email": "donor@example.com", "email_verified": true } },
  "operation": "create",
  "data": {
    "campaignId": "camp_555",
    "amount": 50000,
    "paymentStatus": "verified",
    "receiptNumber": "REC/80G/2026/FORGED"
  },
  "expectedResult": "PERMISSION_DENIED (Public donor can only create pending_verification)"
}
```

### Payload 12: Denial of Wallet Resource Poisoning (1.5MB Junk Injection)
```json
{
  "targetCollection": "volunteerApplications",
  "targetDocId": "app_poison_000",
  "actorAuth": { "uid": "spammer_999", "token": { "email": "spammer@example.com", "email_verified": true } },
  "operation": "create",
  "data": {
    "applicantUid": "spammer_999",
    "fullLegalName": "A".repeat(15000),
    "status": "pending"
  },
  "expectedResult": "PERMISSION_DENIED (Size limits exceeded via isValidId/schema guards)"
}
```
