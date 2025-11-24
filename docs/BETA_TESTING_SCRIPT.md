# Beta Testing Script

This document provides a structured testing script for MANGU Publishing internal beta testers.

## Pre-Testing Setup

### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/redinc23/mangu_publishing-site.git
cd mangu_publishing-site

# Install dependencies
npm install

# Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit server/.env and set:
# BETA_MODE=true
# NODE_ENV=beta
```

### 2. Start the Application
```bash
# Terminal 1: Start server
cd server && npm run dev

# Terminal 2: Start client
cd client && npm run dev
```

### 3. Access Points
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **Status Dashboard**: http://localhost:5173/beta/status

## Testing Checklist

### Session 1: Initial Setup & Navigation (15 minutes)

#### Test 1.1: Application Loads
- [ ] Navigate to http://localhost:5173
- [ ] Page loads without errors
- [ ] Beta banner appears at top
- [ ] Homepage displays featured content
- **Expected**: Clean homepage with beta banner
- **Report If**: Page crashes, blank screen, or missing content

#### Test 1.2: Beta Features
- [ ] Beta banner is visible
- [ ] Click "Give Feedback" button
- [ ] Feedback modal opens
- [ ] Submit test feedback
- [ ] Modal closes, success message appears
- **Expected**: Smooth feedback submission
- **Report If**: Modal doesn't open, submission fails, or errors occur

#### Test 1.3: Beta Status Dashboard
- [ ] Navigate to http://localhost:5173/beta/status
- [ ] Dashboard loads completely
- [ ] System status shows as "healthy" or "degraded"
- [ ] Service health displays (database, redis status)
- [ ] Feature flags list is visible
- **Expected**: Complete dashboard with all sections
- **Report If**: Dashboard crashes, missing sections, or incorrect data

#### Test 1.4: Navigation
- [ ] Click "Library" in navigation
- [ ] Library page loads with books grid
- [ ] Click on a book
- [ ] Book details page loads
- [ ] Use browser back button
- [ ] Previous page loads correctly
- **Expected**: Smooth navigation between pages
- **Report If**: Navigation breaks, pages don't load, or browser errors

**Break: 5 minutes**

### Session 2: Authentication & User Management (20 minutes)

#### Test 2.1: Sign Up
- [ ] Navigate to /signup
- [ ] Sign up form is visible
- [ ] Fill in registration details
- [ ] Submit form
- [ ] Account created successfully
- **Expected**: Successful registration
- **Report If**: Form validation issues, submission errors, or redirect problems

#### Test 2.2: Sign In
- [ ] Navigate to /signin
- [ ] Enter credentials
- [ ] Submit login form
- [ ] Redirect to homepage/dashboard
- [ ] User session persists on page refresh
- **Expected**: Successful login with persistent session
- **Report If**: Login fails, session lost on refresh, or errors occur

#### Test 2.3: Profile Management
- [ ] Navigate to /profile
- [ ] Profile page loads
- [ ] View user information
- [ ] Edit profile (if available)
- [ ] Save changes
- **Expected**: Profile loads and edits save correctly
- **Report If**: Profile doesn't load, edits fail, or data inconsistencies

**Break: 5 minutes**

### Session 3: Book Discovery & Reading (25 minutes)

#### Test 3.1: Browse Library
- [ ] Navigate to /library
- [ ] Books grid displays
- [ ] At least 10 books visible
- [ ] Book covers load
- [ ] Titles and authors visible
- **Expected**: Complete book grid with images
- **Report If**: Missing books, broken images, or layout issues

#### Test 3.2: Search Functionality
- [ ] Use search bar on library page
- [ ] Type "quantum" (or any keyword)
- [ ] Search results update
- [ ] Results are relevant
- [ ] Clear search works
- **Expected**: Accurate, fast search results
- **Report If**: Search doesn't work, results are wrong, or performance is slow

#### Test 3.3: Filter & Sort
- [ ] Try category filters (if available)
- [ ] Books filter correctly
- [ ] Try sorting options (if available)
- [ ] Sort order changes appropriately
- **Expected**: Filters and sorts work correctly
- **Report If**: Filters don't apply, sorts fail, or UI breaks

#### Test 3.4: Book Details
- [ ] Click on a book
- [ ] Book details page loads
- [ ] Cover image displays
- [ ] Title, author, description visible
- [ ] Rating/reviews visible (if available)
- [ ] "Add to Cart" or "Read Now" button present
- **Expected**: Complete book information
- **Report If**: Missing data, broken layout, or errors

#### Test 3.5: Reader Experience
- [ ] Click "Read Now" on a book
- [ ] Reader view opens
- [ ] Book content displays
- [ ] Try page navigation (if available)
- [ ] Try zoom/font controls (if available)
- **Expected**: Smooth reading experience
- **Report If**: Content doesn't load, navigation fails, or reader crashes

**Break: 10 minutes**

### Session 4: Shopping & Cart (15 minutes)

#### Test 4.1: Add to Cart
- [ ] From book details, click "Add to Cart"
- [ ] Success message appears
- [ ] Cart icon updates (if available)
- [ ] Navigate to /cart
- [ ] Book appears in cart
- **Expected**: Item successfully added to cart
- **Report If**: Add fails, cart doesn't update, or errors occur

#### Test 4.2: Cart Management
- [ ] View items in cart
- [ ] Update quantity (if available)
- [ ] Remove an item
- [ ] Cart total updates correctly
- **Expected**: Cart operations work smoothly
- **Report If**: Updates fail, totals incorrect, or UI issues

#### Test 4.3: Checkout Process (Test Mode)
- [ ] Click "Checkout" or "Proceed to Payment"
- [ ] Checkout form/page loads
- [ ] Fill in test payment details
- [ ] Submit order
- [ ] Order confirmation appears
- **Expected**: Smooth checkout (test mode, no real payment)
- **Report If**: Checkout fails, payment errors, or confirmation missing

### Session 5: Admin Features (Admin Users Only) (15 minutes)

#### Test 5.1: Admin Access
- [ ] Navigate to /admin
- [ ] Admin dashboard loads
- [ ] Dashboard widgets visible
- [ ] Navigation menu present
- **Expected**: Admin dashboard loads for admin users
- **Report If**: Access denied (if you're admin), dashboard crashes, or missing features

#### Test 5.2: Book Management
- [ ] Access book management section
- [ ] Book list displays
- [ ] Try creating a new book (if available)
- [ ] Try editing a book (if available)
- [ ] Changes save successfully
- **Expected**: Full CRUD operations work
- **Report If**: Operations fail, data doesn't save, or errors occur

#### Test 5.3: User Management
- [ ] Access user management section
- [ ] User list displays
- [ ] View user details
- [ ] Try editing user permissions (if available)
- **Expected**: User management works correctly
- **Report If**: Access fails, data doesn't load, or operations break

**Break: 10 minutes**

### Session 6: Audiobooks & Media (If Enabled) (15 minutes)

#### Test 6.1: Audiobook Access
- [ ] Navigate to /audiobooks
- [ ] Audiobook library loads
- [ ] Select an audiobook
- [ ] Audiobook player opens
- **Expected**: Audiobook interface loads
- **Report If**: Page doesn't load, no audiobooks visible, or errors

#### Test 6.2: Audio Playback
- [ ] Click play on audiobook
- [ ] Audio starts playing
- [ ] Try pause/resume
- [ ] Try seek/scrub timeline
- [ ] Try speed adjustment
- [ ] Try volume control
- **Expected**: Full playback control
- **Report If**: Audio doesn't play, controls don't work, or player crashes

### Session 7: Edge Cases & Stress Testing (20 minutes)

#### Test 7.1: Network Conditions
- [ ] Open DevTools (F12)
- [ ] Simulate slow 3G
- [ ] Navigate between pages
- [ ] Check loading indicators
- [ ] Return to normal speed
- **Expected**: Graceful handling of slow network
- **Report If**: App hangs, no loading indicators, or crashes

#### Test 7.2: Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if on Mac)
- [ ] Test in Edge
- **Expected**: Works in all modern browsers
- **Report If**: Browser-specific issues or features not working

#### Test 7.3: Mobile Responsiveness
- [ ] Open DevTools (F12)
- [ ] Toggle device emulation
- [ ] Test on mobile viewport (375x667)
- [ ] Test on tablet viewport (768x1024)
- [ ] Check menu navigation
- [ ] Check touch interactions
- **Expected**: Fully responsive design
- **Report If**: Layout breaks, features inaccessible, or UI issues

#### Test 7.4: Error Scenarios
- [ ] Navigate to /nonexistent-page
- [ ] 404 page displays
- [ ] Try invalid search queries
- [ ] Try submitting empty forms
- [ ] Check error messages are helpful
- **Expected**: Graceful error handling
- **Report If**: Crashes, unhelpful errors, or poor UX

### Session 8: Performance & Security (15 minutes)

#### Test 8.1: Page Load Performance
- [ ] Open DevTools Network tab
- [ ] Hard refresh homepage (Ctrl+Shift+R)
- [ ] Check initial page load time
- [ ] Should be under 3 seconds
- [ ] Check number of requests
- **Expected**: Fast load times
- **Report If**: Slow loads, too many requests, or large bundle sizes

#### Test 8.2: Console Errors
- [ ] Open DevTools Console
- [ ] Navigate through the app
- [ ] Check for JavaScript errors
- [ ] Check for network errors
- **Expected**: No critical errors
- **Report If**: Console full of errors, warnings, or failed requests

#### Test 8.3: Security Basics
- [ ] Check HTTPS is used (in production)
- [ ] Try accessing admin without auth
- [ ] Check password is masked in forms
- [ ] Check sensitive data not in URLs
- **Expected**: Basic security measures in place
- **Report If**: Security concerns or vulnerabilities

## Post-Testing

### Submit Comprehensive Feedback
1. Visit http://localhost:5173/beta/status
2. Use the feedback form or email beta-feedback@mangu.com
3. Include:
   - Overall impression (1-10)
   - What worked well
   - What didn't work
   - Bugs found (with reproduction steps)
   - Feature suggestions
   - Browser/OS used
   - Any screenshots or recordings

### Report Critical Issues
For critical bugs (crashes, data loss, security issues):
1. Report immediately via GitHub Issues
2. Use "critical" label
3. Provide detailed reproduction steps
4. Include console logs and screenshots

## Testing Tips

1. **Take Notes**: Document everything as you test
2. **Be Systematic**: Follow the script in order
3. **Be Thorough**: Don't skip steps
4. **Be Creative**: Try unexpected actions
5. **Be Patient**: Beta software has bugs - that's why we're testing!
6. **Take Breaks**: Fatigue leads to missing issues
7. **Use Different Data**: Try various inputs and scenarios
8. **Check Boundaries**: Test limits (empty fields, max values, etc.)
9. **Think Like a User**: Not just a tester
10. **Have Fun**: You're helping build something great!

## Success Metrics

A successful testing session includes:
- [ ] All critical workflows tested
- [ ] At least 3 bugs reported (with reproduction steps)
- [ ] Feedback submitted
- [ ] Edge cases explored
- [ ] Notes documented

## Need Help?

- **Documentation**: Check docs/ folder for guides
- **Known Issues**: Review docs/KNOWN_ISSUES.md
- **Troubleshooting**: See docs/TROUBLESHOOTING.md
- **Questions**: Open a GitHub Issue or email beta-feedback@mangu.com

---

Thank you for being a beta tester! Your feedback is invaluable. 🚀
