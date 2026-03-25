# Gym Owner Staff Flow - Testing Checklist

## Overview
This document provides comprehensive manual and automated test coverage for the gym owner staff dashboard flow. The staff flow includes:
- Staff list page (`/dashboard/gym-owner/staff`)
- Staff detail page (`/dashboard/gym-owner/staff/[trainerId]`)
- Staff invite page (`/dashboard/gym-owner/staff/invite`)
- Revenue subpage (`/dashboard/gym-owner/staff/[trainerId]/revenue`)
- Schedule subpage (`/dashboard/gym-owner/staff/[trainerId]/schedule`)

All pages use real organization data from the teams API instead of hardcoded mocks.

---

## Automated Tests
Run automated tests with:
```bash
npm test -- staff
npm test:watch -- staff
```

Test files:
- `src/app/dashboard/gym-owner/staff/page.test.tsx` - Staff list
- `src/app/dashboard/gym-owner/staff/[trainerId]/page.test.tsx` - Staff detail
- `src/app/dashboard/gym-owner/staff/invite/page.test.tsx` - Staff invite

---

## Manual Testing Checklist

### Prerequisites
- [ ] Logged in as a gym owner
- [ ] Have at least one organization created
- [ ] Development API server running
- [ ] Browser DevTools open (Network tab and Console)

---

## 1. Staff List Page (`/dashboard/gym-owner/staff`)

### 1.1 Initial Load
- [ ] Page loads without errors
- [ ] Loading spinner appears briefly
- [ ] All team members from organization are listed
- [ ] Member cards show:
  - [ ] Member name (first + last)
  - [ ] Member email
  - [ ] Member initials in avatar
  - [ ] Current status badge (Active, Pending, or Inactive)
  - [ ] Role name
  - [ ] Last action menu (view, edit, delete)

### 1.2 Member Card Rendering
- [ ] Active members show green status badge
- [ ] Pending members show yellow status badge
- [ ] Inactive members show gray status badge
- [ ] Member names are formatted correctly (no null/undefined values)
- [ ] Gravatar or default avatar displays for each member

### 1.3 Search Functionality
- [ ] Search box is visible and functional
- [ ] Searching by member name filters results
- [ ] Searching by email filters results
- [ ] Searching by role name filters results
- [ ] Search is case-insensitive
- [ ] Results update in real-time as you type
- [ ] Clearing search shows all members again

### 1.4 Status Filter
- [ ] Status filter dropdown shows options: All, Active, Pending, Inactive
- [ ] Filter is enabled (not disabled)
- [ ] Clicking "Active" shows only active members
- [ ] Clicking "Pending" shows only pending members
- [ ] Clicking "Inactive" shows only inactive members
- [ ] Clicking "All" shows all members
- [ ] Filter persists when searching

### 1.5 Pending Invitations Sidebar
- [ ] Sidebar titled "Pending Invitations" appears on the right
- [ ] Shows list of pending invitations with:
  - [ ] Invited email address
  - [ ] Invitation sent date (formatted correctly)
  - [ ] Expiration date (formatted correctly)
  - [ ] Status badge (Pending, Expired, etc.)
- [ ] Expiration dates are formatted using user's timezone
- [ ] Expired invitations show with visual distinction
- [ ] Empty state message appears if no pending invitations

### 1.6 Statistics Widget
- [ ] Stats widget shows:
  - [ ] Total Staff count (correct number)
  - [ ] Pending Invitations count
  - [ ] Inactive Members count
  - [ ] Unique Roles count
- [ ] Stats update when inviting new members
- [ ] Stats update when changing member status

### 1.7 Invite Button
- [ ] "Invite Staff Member" button is visible
- [ ] Button is enabled (not disabled)
- [ ] Clicking button navigates to `/dashboard/gym-owner/staff/invite`
- [ ] Button styling matches other CTAs (green background)

### 1.8 Error Handling
- [ ] If API fails to load members, error message displays
- [ ] If API fails to load invitations, error message displays
- [ ] Error messages are user-friendly (not raw API errors)
- [ ] Retry button appears if error occurs
- [ ] Page recovers gracefully from temporary network issues

### 1.9 Edge Cases
- [ ] Empty staff list shows appropriate message
- [ ] Very long member names don't break layout
- [ ] Very long email addresses don't break layout
- [ ] Special characters in names render correctly
- [ ] Multiple pending invitations display properly

---

## 2. Staff Detail Page (`/dashboard/gym-owner/staff/[trainerId]`)

### 2.1 Initial Load
- [ ] Page loads with staff member details
- [ ] Loading spinner appears briefly
- [ ] Back button returns to staff list page
- [ ] Staff member name appears in page header
- [ ] Staff member details card displays

### 2.2 Member Information Card
- [ ] Member name displays correctly
- [ ] Member email displays correctly
- [ ] Member initials in avatar
- [ ] Current status shows (Active, Pending, or Inactive)
- [ ] Status badge has correct color
- [ ] Joined date displays (formatted with timezone)
- [ ] Assigned role displays
- [ ] Role description/name is readable

### 2.3 Role Permissions Section
- [ ] "Role Permissions" section displays all permissions
- [ ] Permissions are displayed as a list (checkmarks or bullet points)
- [ ] All permission names are readable
- [ ] Empty permissions state handled gracefully (if role has no permissions)

### 2.4 Status Toggle (Pause/Restore)
- [ ] Toggle button shows current status (pause/restore)
- [ ] Button label changes based on current status:
  - [ ] If Active: "Pause Access" button appears
  - [ ] If Inactive: "Restore Access" button appears
- [ ] Clicking toggle opens confirmation modal:
  - [ ] Modal title is appropriate ("Pause" vs "Restore")
  - [ ] Modal description explains the action
  - [ ] Confirm button label matches action
  - [ ] Cancel button works (closes modal without action)
- [ ] After confirming pause:
  - [ ] API call is made
  - [ ] Status updates to Inactive
  - [ ] Status badge changes color
  - [ ] Button label changes to "Restore"
  - [ ] Success message appears (optional)
- [ ] After confirming restore:
  - [ ] API call is made
  - [ ] Status updates to Active
  - [ ] Status badge changes color
  - [ ] Button label changes to "Pause"
  - [ ] Success message appears (optional)

### 2.5 Remove Member Action
- [ ] "Remove Member" button is visible
- [ ] Button has danger/red styling
- [ ] Clicking button opens confirmation modal:
  - [ ] Modal title is "Remove this staff member?"
  - [ ] Modal explains the consequences ("loses team access immediately")
  - [ ] Confirm button is labeled "Remove Member"
  - [ ] Cancel button closes modal without action
- [ ] After confirming removal:
  - [ ] API call is made to remove member
  - [ ] User is redirected to staff list page
  - [ ] Removed member no longer appears in list
  - [ ] Success message appears (optional)

### 2.6 Subpage Navigation
- [ ] "Revenue" tab/link is visible and clickable
- [ ] "Schedule" tab/link is visible and clickable
- [ ] Clicking tabs navigates to subpages
- [ ] Subpage URLs are correct:
  - [ ] `/dashboard/gym-owner/staff/[trainerId]/revenue`
  - [ ] `/dashboard/gym-owner/staff/[trainerId]/schedule`

### 2.7 Error Handling
- [ ] If member ID doesn't exist, error message displays
- [ ] If member doesn't belong to organization, error message displays
- [ ] If API fails during status update, error displays
- [ ] If API fails during removal, error displays and member is NOT removed
- [ ] Retry button appears if error occurs

### 2.8 Edge Cases
- [ ] Navigating directly to invalid member ID shows error
- [ ] Changing organization filters out staff members
- [ ] Rapid clicking of toggle button doesn't cause double submissions
- [ ] Member with role but no permissions displays gracefully

---

## 3. Staff Invite Page (`/dashboard/gym-owner/staff/invite`)

### 3.1 Initial Load
- [ ] Page loads with invite form
- [ ] Loading spinner appears while roles load
- [ ] Back button returns to staff list page
- [ ] Page title/heading is visible

### 3.2 Team Roles Dropdown
- [ ] Roles dropdown shows all available team roles
- [ ] Default role is auto-selected (trainer-like role)
- [ ] Roles dropdown is functional and clickable
- [ ] Each role displays:
  - [ ] Role name
  - [ ] Role code (if applicable)
- [ ] Empty state handled if no roles available

### 3.3 Role Preview Section
- [ ] Selected role displays in a preview card
- [ ] Role preview shows:
  - [ ] Role name
  - [ ] Permission count ("3 permissions")
  - [ ] List of permissions
- [ ] Preview updates when selecting different role
- [ ] Permission names are readable and meaningful

### 3.4 Email Input
- [ ] Email input field is visible and focusable
- [ ] Placeholder text guides user
- [ ] Email input accepts valid email formats
- [ ] Email input validates format (basic validation)
- [ ] Can clear email input

### 3.5 Submit Form
- [ ] "Send Invitation" button is visible and enabled
- [ ] Button label is clear ("Send Invitation")
- [ ] Clicking button with valid data:
  - [ ] Loading state appears on button (optional spinner)
  - [ ] API call is made to send invitation
  - [ ] Success message appears
  - [ ] User is redirected to staff list after ~900ms
  - [ ] New invitation appears in pending invitations
- [ ] Form validation before submit:
  - [ ] Cannot submit with empty email
  - [ ] Cannot submit without role selected
  - [ ] Error messages appear for missing fields

### 3.6 Form Validation
- [ ] Invalid email formats show error message
- [ ] Required fields show error when empty
- [ ] Errors clear when fields are corrected
- [ ] Submit button disabled while form is invalid (optional)

### 3.7 Error Handling
- [ ] If roles fail to load, error message displays
- [ ] If invitation fails to send:
  - [ ] Error message appears
  - [ ] User stays on page (not redirected)
  - [ ] Can retry without reloading
- [ ] Duplicate email invitation:
  - [ ] API error is handled gracefully
  - [ ] Error message explains (e.g., "User already invited")

### 3.8 Edge Cases
- [ ] Inviting an existing team member shows appropriate error
- [ ] Special characters in email handled correctly
- [ ] Very long emails don't break form layout
- [ ] Navigating away mid-form loses data (expected behavior)

---

## 4. Revenue Subpage (`/dashboard/gym-owner/staff/[trainerId]/revenue`)

### 4.1 Initial Load
- [ ] Page loads with organization revenue data
- [ ] Loading spinner appears briefly
- [ ] Member context displays (name, role, joined date, status)
- [ ] Back button returns to staff detail page

### 4.2 Revenue Stats Display
- [ ] Organization revenue appears in stats cards:
  - [ ] Today's revenue (numeric value)
  - [ ] This week's revenue (numeric value)
  - [ ] This month's revenue (numeric value)
- [ ] Revenue formatting:
  - [ ] Currency symbol displays correctly
  - [ ] Decimal places are consistent
  - [ ] Thousands separators display (if applicable)
- [ ] Stats update when data loads

### 4.3 Member Context
- [ ] Member name displays correctly
- [ ] Role assignment displays correctly
- [ ] Joined date displays with timezone
- [ ] Member status shows correct badge

### 4.4 Navigation Links
- [ ] "View Full Revenue Dashboard" link is visible
- [ ] Link navigates to `/dashboard/gym-owner/revenue`
- [ ] Link hover state works

### 4.5 Scope Explanation
- [ ] Note appears: "Revenue reflects organization-level earnings"
- [ ] This clarifies that data is NOT trainer-specific
- [ ] Note is clearly visible and readable

### 4.6 Error Handling
- [ ] If revenue data fails to load, error message displays
- [ ] If member data fails to load, error message displays
- [ ] Error messages are user-friendly
- [ ] Retry button appears if error occurs

---

## 5. Schedule Subpage (`/dashboard/gym-owner/staff/[trainerId]/schedule`)

### 5.1 Initial Load
- [ ] Page loads with availability rules and exceptions
- [ ] Loading spinner appears briefly
- [ ] Member context displays (name, role, joined date, status)
- [ ] Back button returns to staff detail page

### 5.2 Day Selector
- [ ] Days of week appear: Sun, Mon, Tue, Wed, Thu, Fri, Sat
- [ ] Days are clickable buttons
- [ ] Selected day has visual highlight (different background color)
- [ ] Clicking day filters availability rules for that day

### 5.3 Availability Rules Display
- [ ] Availability rules for selected day appear
- [ ] Each rule displays:
  - [ ] Day of week
  - [ ] Start time (formatted)
  - [ ] End time (formatted)
  - [ ] Timezone (if applicable)
- [ ] Rules are sorted by start time
- [ ] Empty state if no rules for selected day

### 5.4 Statistics Widget
- [ ] Stats display:
  - [ ] Active Rules count (total)
  - [ ] Exceptions count (total)
  - [ ] Unavailable Days count
  - [ ] Selected Day Slots count
- [ ] Stats update when day is selected
- [ ] Numbers are accurate

### 5.5 Upcoming Exceptions Preview
- [ ] "Upcoming Exceptions" section shows next 5 exceptions
- [ ] Each exception displays:
  - [ ] Exception date (formatted with timezone)
  - [ ] Exception type (UNAVAILABLE, etc.)
  - [ ] Duration (if applicable)
- [ ] Exceptions are sorted by date (upcoming first)
- [ ] Empty state if no upcoming exceptions

### 5.6 Navigation Links
- [ ] "Manage Availability" link is visible
- [ ] Link navigates to `/dashboard/gym-owner/consultations`
- [ ] Link text is clear and intuitive
- [ ] Link hover state works

### 5.7 Timezone Context
- [ ] User's timezone is displayed (if visible in UI)
- [ ] Dates and times are formatted for user's timezone
- [ ] Timezone changes (if supported) update display

### 5.8 Error Handling
- [ ] If availability rules fail to load, error message displays
- [ ] If exceptions fail to load, error message displays
- [ ] If member data fails to load, error message displays
- [ ] Error messages are user-friendly
- [ ] Retry button appears if error occurs

### 5.9 Data Accuracy
- [ ] Rules counts match API data
- [ ] Exception counts match API data
- [ ] Unavailable days are filtered correctly (status: UNAVAILABLE)
- [ ] Rules are filtered by correct dayOfWeek

---

## 6. Cross-Feature Tests

### 6.1 Navigation Flow
- [ ] Staff List → Detail → Revenue (works)
- [ ] Staff List → Detail → Schedule (works)
- [ ] Invite → Staff List (works)
- [ ] Detail → Staff List (works)
- [ ] Back buttons work at each level

### 6.2 Real-Time Updates
- [ ] After inviting staff, they appear in pending invitations
- [ ] After pausing staff, status updates in detail page
- [ ] After toggling status, stats widget updates
- [ ] After removing staff, they disappear from list

### 6.3 Auth & Context
- [ ] All pages require authentication (redirect if not logged in)
- [ ] All pages require organization context (error if no org)
- [ ] Changing organization re-loads all data
- [ ] Logging out redirects to login page

### 6.4 Error Recovery
- [ ] Network error during API call shows error message
- [ ] Temporary failures don't break UI
- [ ] Retry functionality works
- [ ] No data loss on error (form data persists)

---

## 7. Regression Tests

### 7.1 Previous Behavior
- [ ] No hardcoded trainer names in any page
- [ ] No hardcoded revenue values in any page
- [ ] No hardcoded schedule values in any page
- [ ] All data comes from real APIs

### 7.2 API Integration
- [ ] Staff list calls `teamsService.getMembers()`
- [ ] Staff list calls `teamsService.getInvitations()`
- [ ] Staff detail calls `teamsService.getMembers()`
- [ ] Staff detail calls `teamsService.updateMember()`
- [ ] Staff detail calls `teamsService.removeMember()`
- [ ] Invite calls `teamsService.getRoles()`
- [ ] Invite calls `teamsService.inviteMember()`
- [ ] Revenue calls `checkinsService.getOrgDashboardStats()`
- [ ] Schedule calls `consultationsService.getMyAvailability()`
- [ ] Schedule calls `consultationsService.getMyExceptions()`

---

## Performance Checks

- [ ] Page loads in < 2 seconds
- [ ] Search filters in < 500ms
- [ ] Status toggle completes in < 3 seconds
- [ ] Invite submission completes in < 5 seconds
- [ ] No unnecessary re-renders (check DevTools Profiler)
- [ ] No memory leaks (check DevTools Memory tab)

---

## Accessibility Checks

- [ ] All buttons have clear labels
- [ ] All form inputs have associated labels
- [ ] Confirmation modals have keyboard focus handling
- [ ] Error messages are announced
- [ ] Color is not the only indicator of status (icons/text also used)
- [ ] Page works with keyboard navigation (Tab/Enter/Escape)

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Verify:
- [ ] Layouts work on all browsers
- [ ] Forms submit correctly
- [ ] API calls work
- [ ] Modals display correctly
- [ ] No console errors

---

## Deployment Readiness

- [ ] No hardcoded API URLs (uses `NEXT_PUBLIC_API_URL`)
- [ ] No console.logs left in production code
- [ ] No uncommitted changes
- [ ] All tests pass
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint warnings (staff-related files)

---

## Notes & Observations

Use this section to document any findings during testing:

```
Date: _______________
Tester: _______________
Environment: Development / Staging / Production
Browser: _______________
OS: _______________

Issues Found:
- [ ] 
- [ ] 
- [ ] 

Observations:
- [ ] 
- [ ] 

Sign-off: _______________
```
