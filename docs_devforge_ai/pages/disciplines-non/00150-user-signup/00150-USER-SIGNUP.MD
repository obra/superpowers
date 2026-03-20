# User Signup Page Implementation (1300_00150)

This document provides detailed implementation documentation for the User Signup page, which is now a React component fully integrated into the Single-Page Application (SPA) architecture.

For related documentation, see:

- [Documentation Guide](./0000_DOCUMENTATION_GUIDE.md)
- [Page Implementations Overview](./1300_0000_PAGE_IMPLEMENTATIONS.md)
- [Login Page Implementation](./1300_00100_LOGIN_PAGE.md)
- [Security Model](./0400_SECURITY_MODEL.md)
- [Supabase Integration](./0500_SUPABASE.md)
- [Internationalization](./0800_INTERNATIONALIZATION.md)

## File Structure

The User Signup page uses the following structure:

```
client/src/pages/00150-user-signup/
├── styles/
│   └── 00150-style.css           # Page-specific styles
└── components/
    └── 00150-UserSignup.js       # Main React component

client/src/common/js/auth/
├── 0175-auth-utils.js           # Shared auth utilities
├── 0175-auth-core.js           # Core auth functionality
└── 0175-supabase-client.js     # Supabase client setup
```

## Component Implementation

### UserSignup Component

The UserSignup component (`00150-UserSignup.js`) manages:

- Form validation
- Password strength checking
- Role selection
- Error handling
- i18n integration
- RTL support
- Supabase authentication

```jsx
// Example usage
import { UserSignup } from './components/00150-UserSignup';

const UserSignup = () => {
  const { t } = useTranslation('signup');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  return (
    <div className="page-container">
      <AccordionComponent settingsManager={settingsManager} />
      <div className="content-wrapper">
        <form onSubmit={handleSubmit}>
          {/* Form fields with validation */}
          <div className="form-group">
            <label htmlFor="email">{t('signup.form.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          {/* Password fields with strength indicator */}
          {/* Role selection */}
          {/* Submit button */}
        </form>
      </div>
    </div>
  );
};
```

## Auth Utilities

The auth utilities (`0175-auth-utils.js`) provide shared functionality:

```javascript
// Password strength checking
export const checkPasswordStrength = (password) => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
  const mediumRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/;
  
  if (strongRegex.test(password)) return "strong";
  if (mediumRegex.test(password)) return "medium";
  return "weak";
};

// Error handling with i18n
export const showError = (error, t, prefix, setError) => {
  const errorKey = mapErrorToTranslationKey(error, prefix);
  setError(t(errorKey));
  setTimeout(() => setError(''), 5000);
};
```

## Webpack Integration

The user signup page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Features

1. **Form Validation**
   - Email format validation
   - Password strength requirements
   - Password confirmation matching
   - Required field validation
   - Real-time validation feedback

2. **Password Strength Indicator**
   - Visual strength indicator
   - Multiple strength levels:
     - Weak: Basic requirements not met
     - Medium: Some requirements met
     - Strong: All requirements met
   - Requirements:

     ```javascript
     // Strong password requires:
     // - At least 8 characters
     // - Uppercase and lowercase letters
     // - Numbers
     // - Special characters
     ```

3. **Automatic Role Assignment**
   - New users are automatically assigned the basic "user" role
   - Role assignments managed through administrative approval process
   - Permissions controlled via separate admin interface
   - Users can request specific roles through their manager or IT support

4. **Error Handling**
   - Translated error messages
   - Temporary error display
   - Network error handling
   - Auth error handling

## Best Practices

1. **Security**
   - Password strength enforcement
   - Secure password handling
   - HTTPS enforcement
   - CSRF protection

2. **Accessibility**
   - ARIA labels
   - Form validation messages
   - Keyboard navigation
   - Screen reader support

3. **Performance**
   - Optimized bundle size
   - Lazy loading
   - Error boundary implementation
   - Proper cleanup

4. **Code Organization**
   - Shared auth utilities
   - Component modularity
   - Clear error mapping
   - Consistent naming conventions

## RTL Support

RTL support is implemented through:

1. Form field alignment
2. Error message positioning
3. Button ordering
4. Icon direction handling

```css
/* Example RTL CSS */
[dir="rtl"] {
  .form-group {
    text-align: right;
  }

  .error-message {
    padding-right: 20px;
    padding-left: 0;
  }
}
```

## Migration Status

### Completed

- ✅ React component migration
- ✅ Full SPA integration (no longer separate entry point or HTML)
- ✅ Obsolete static files removed
- ✅ Auth utilities implementation
- ✅ Form validation
- ✅ Password strength indicator
- ✅ i18n support
- ✅ RTL support
- ✅ Supabase integration
- ✅ Standardized background image implementation

## Future Improvements

1. Add social login options
2. Implement email verification
3. Add password recovery flow
4. Enhance mobile responsiveness
5. Add progressive form validation
6. Implement rate limiting

## Usage

To access the User Signup page, navigate through the application's routing. Direct URL access to a standalone HTML file is no longer applicable.

## Development

To run the development server:

```bash
npm run dev
```

## Related Documentation

- [Login Page Implementation](./1300_00100_LOGIN_PAGE.md)
- [Page Permissions Roles & Permissions](../role-permissions/01300_00000_PAGE_PERMISSIONS_ROLES_PERMISSIONS.md)
- [Security Model](./0400_SECURITY_MODEL.md)
- [Supabase Integration](./0500_SUPABASE.md)
