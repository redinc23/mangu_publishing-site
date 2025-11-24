# Known Issues - Internal Beta

This document tracks known issues in the MANGU Publishing internal beta. Issues are prioritized and tracked for resolution.

## 🔴 Critical Issues

None currently identified. Please report any critical issues immediately!

## 🟡 High Priority

### Performance
- **Large Library Loading**: Initial library page load may be slow with 1000+ books
  - **Workaround**: Pagination is implemented, use filters to narrow results
  - **Status**: Under investigation

### Features
- **Offline Mode**: Reading while offline not yet supported
  - **Workaround**: Ensure stable internet connection
  - **Status**: Planned for future release

## 🟢 Medium Priority

### UI/UX
- **Mobile Navigation**: Side menu may not close on iOS Safari in some cases
  - **Workaround**: Refresh the page
  - **Status**: Fix in progress

- **Book Cover Loading**: Some book covers may load slowly
  - **Workaround**: Images are cached after first load
  - **Status**: Optimizing image delivery

### Browser Compatibility
- **IE11 Support**: Not fully supported
  - **Workaround**: Use modern browsers (Chrome, Firefox, Safari, Edge)
  - **Status**: IE11 support not planned

## 🔵 Low Priority

### Minor Bugs
- **Search Autocomplete**: May not show all suggestions on first keystroke
  - **Workaround**: Continue typing or use advanced search
  - **Status**: Enhancement planned

- **Profile Avatar Upload**: Only JPG and PNG supported
  - **Workaround**: Convert images to supported formats
  - **Status**: Additional formats planned

## 📝 Limitations

### Beta Version Limitations
- **Payment Processing**: Test mode only, no real transactions
- **Email Notifications**: May be delayed or go to spam
- **Data Persistence**: Test data may be reset periodically
- **API Rate Limiting**: 100 requests per minute per user

### Feature Scope
The following features are planned but not yet available:
- Social sharing and book clubs
- Advanced reading statistics
- Multi-language support
- Bulk book downloads
- Reading challenges and achievements

## 🆕 Recently Fixed

### v0.9.1-beta
- ✅ Fixed: Cart items not persisting after page refresh
- ✅ Fixed: Book search returning no results for partial titles
- ✅ Fixed: Profile page crashing on first load

### v0.9.0-beta
- ✅ Fixed: Database connection issues on startup
- ✅ Fixed: Redis cache not being utilized
- ✅ Fixed: Audiobook player controls not responding

## 📢 Reporting New Issues

If you encounter an issue not listed here:

1. Check if it's already reported in [GitHub Issues](https://github.com/redinc23/mangu_publishing-site/issues)
2. Search the internal Slack channel for similar reports
3. Create a new issue with detailed information:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (browser, OS, device)
   - Screenshots or error messages

## 🔄 Update Frequency

This document is updated:
- **Daily** during active beta testing
- **Weekly** for maintenance updates
- **Immediately** for critical issues

Last updated: 2025-11-24
