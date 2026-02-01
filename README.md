# FarmEazy Frontend - React + Vite

A modern, user-friendly web interface for the FarmEazy smart farm management system.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

The development server will automatically:
- Open at `http://localhost:3000`
- Hot-reload on file changes
- Connect to backend at `http://localhost:8080/api`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable React components
│   │   └── Layout.jsx     # Main layout with navigation
│   ├── pages/             # Page components (routes)
│   │   ├── Login.jsx      # User login page
│   │   ├── Register.jsx   # User registration
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   ├── Farms.jsx      # Farm management
│   │   ├── FarmDetail.jsx # Individual farm view
│   │   ├── Crops.jsx      # Crop tracking
│   │   └── IrrigationSchedules.jsx
│   ├── services/          # API and business logic
│   │   ├── AuthService.js        # Authentication
│   │   └── apiClient.js          # Axios with interceptors
│   ├── config/
│   │   └── api.js         # API endpoints configuration
│   ├── App.jsx            # Root component with routing
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles (Tailwind)
├── public/                # Static assets
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS config
├── postcss.config.js      # CSS processing
└── index.html             # HTML entry point
```

## 🔐 Authentication Flow

1. **Registration** (`/register`)
   - User creates account with full name, email, password, phone
   - Password validated (min 6 characters)
   - Phone must be 10 digits (India format)
   - JWT token received and stored in localStorage

2. **Login** (`/login`)
   - User enters email and password
   - JWT token received on successful login
   - Token stored in localStorage for future requests
   - Automatic redirect to dashboard

3. **Protected Routes**
   - All routes except `/login` and `/register` require authentication
   - JWT token automatically added to all API requests
   - 401 responses trigger automatic logout and redirect to login

## 🌐 API Integration

### Base URL
- Development: `http://localhost:8080/api`

### Authentication Header
All authenticated requests automatically include:
```
Authorization: Bearer <jwt_token>
```

### Available Endpoints

**Authentication**
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login and get JWT token

**Farms**
- `GET /farms` - Get all user's farms
- `POST /farms` - Create new farm
- `GET /farms/{id}` - Get farm details
- `PUT /farms/{id}` - Update farm
- `DELETE /farms/{id}` - Delete farm

**Crops**
- `GET /crops` - Get all crops
- `POST /crops` - Create new crop
- `GET /crops/{id}` - Get crop details
- `PUT /crops/{id}` - Update crop
- `DELETE /crops/{id}` - Delete crop

**Irrigation**
- `GET /irrigation` - Get all irrigation schedules
- `POST /irrigation` - Create schedule
- `GET /irrigation/{id}` - Get schedule details
- `PUT /irrigation/{id}` - Update schedule
- `DELETE /irrigation/{id}` - Delete schedule

## 🎨 Design & Styling

- **Framework**: Tailwind CSS 3.3.0
- **Color Scheme**: Green theme for agriculture/farming
- **Responsive**: Mobile-first design, works on all screen sizes
- **Components**: Pre-built utility classes for buttons, forms, cards

### Key CSS Classes
```css
.form-input      /* Styled input fields */
.form-label      /* Form labels */
.btn-primary     /* Primary buttons (green) */
.btn-secondary   /* Secondary buttons (gray) */
.card            /* Reusable card component */
.container-main  /* Max-width container */
.error-message   /* Error text styling */
.success-message /* Success text styling */
```

## 📝 Form Validation

All forms include client-side validation:

**Login Form**
- Email format validation
- Password required (min 6 chars)

**Registration Form**
- Full name required (min 3 chars)
- Valid email format
- Password min 6 characters
- Phone: exactly 10 digits

**Farm Form**
- Farm name required
- Location required
- Area size (number, accepts decimals)

**Crop Form**
- Crop name required
- Crop type required
- Farm selection required
- Status dropdown (PLANTED, GROWING, READY, HARVESTED)

**Irrigation Form**
- Crop selection required
- Schedule date required
- Duration required (in minutes)
- Water amount required (in liters)

## 🔧 Environment Variables

No environment variables required. API base URL is configured in `src/config/api.js`:
```javascript
export const API_BASE_URL = 'http://localhost:8080/api'
```

To change backend URL, edit this file.

## 📦 Dependencies

```json
{
  "react": "^18.2.0",                    // UI library
  "react-dom": "^18.2.0",                // DOM rendering
  "react-router-dom": "^6.18.0",         // Client-side routing
  "axios": "^1.6.2",                     // HTTP client
  "tailwindcss": "^3.3.0",               // CSS framework
  "autoprefixer": "^10.4.16",            // CSS vendor prefixes
  "postcss": "^8.4.31",                  // CSS processing
  "vite": "^5.0.0"                       // Build tool
}
```

## 🚀 Building & Deployment

### Development
```bash
npm run dev    # Runs on port 3000 with hot-reload
```

### Production Build
```bash
npm run build  # Creates optimized dist/ folder
npm run preview # Preview built version locally
```

### Deployment Options
1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Connect GitHub repo to Netlify
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Traditional Server**
   - Run `npm run build`
   - Serve `dist/` folder with any static web server (nginx, Apache, etc.)

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Change port in vite.config.js or use:
npm run dev -- --port 3001
```

### Backend not responding (CORS error)
1. Ensure backend is running on port 8080
2. Check `application.properties` has:
   ```properties
   cors.allowed-origins=http://localhost:3000
   ```
3. Verify API base URL in `src/config/api.js`

### JWT token issues
1. Clear localStorage: Open DevTools → Application → Local Storage → Clear all
2. Log out and log back in
3. Check token expiration (24 hours)

### Styles not loading
```bash
# Rebuild Tailwind CSS
npm install
npm run dev
```

## 📚 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Axios](https://axios-http.com)

## 🔗 Related Projects
- **Backend**: Spring Boot 3.2.0 API at `../backend`
- **Database**: H2 in-memory (for development)

## 📧 Support
For issues or questions, contact: support@farmeazy.com

---

Happy Farming! 🌾
