# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 9015 with Turbopack)
- **Start Cloudflare tunnel**: `cloudflared tunnel --url http://localhost:9015` (manual setup)
- **Update environment with tunnel URL**: `node setup-cloudflare-url.js https://your-url.trycloudflare.com`
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Run linting**: `npm run lint`
- **Run type checking**: `npm run typecheck`
- **Run tests**: Tests use Playwright - configuration in `playwright.config.ts`

## Testing Environment Setup with Cloudflare Tunnel

This is our testing environment for email signatures and PDF generation from prefilled forms being signed by customers.

### Cloudflare Tunnel Setup for External Testing
1. **Install cloudflared:**
   ```bash
   # Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   # Or use chocolatey: choco install cloudflared
   ```

2. **Start Cloudflare tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:9015
   ```

3. **Update environment variable:**
   - Copy the HTTPS forwarding URL from cloudflared (e.g., `https://abc123.trycloudflare.com`)
   - Update `NEXT_PUBLIC_BASE_URL` in `.env.local` with the tunnel URL
   - Or use the helper script: `node setup-cloudflare-url.js https://abc123.trycloudflare.com`

4. **Restart development server:**
   ```bash
   npm run dev
   ```

### Testing Capabilities with Cloudflare Tunnel
- **Email Signature Testing**: Send emails with form links accessible from any device
- **PDF Generation Testing**: Test PDF generation from prefilled customer forms
- **External Form Access**: Allow customers to access and sign documents from mobile devices
- **JotForm Integration**: Test webhook endpoints with external URLs
- **Cross-device Testing**: Test the application from different devices and networks

### Testing Workflow
1. Start local development server (`npm run dev`)
2. Start Cloudflare tunnel on port 9015 (`cloudflared tunnel --url http://localhost:9015`)
3. Update `.env.local` with tunnel URL (`node setup-cloudflare-url.js https://your-url.trycloudflare.com`)
4. Restart development server to pick up new environment variable
5. Test email links and form submissions from external devices
6. Verify PDF generation and signature workflows

### Important Notes
- Keep cloudflared window open during testing sessions
- Cloudflare tunnel URL changes each restart (free tier limitation)
- All form links in emails will use the tunnel URL for external access

### Auto-Restart Development Server

**CRITICAL**: When testing code updates, the development server must be restarted to pick up environment variable changes:

#### When Auto-Restart is Required:
- After updating `NEXT_PUBLIC_BASE_URL` in `.env.local`
- After running `npm run setup-local-ip`
- After running `node setup-cloudflare-url.js`
- When switching between local/tunnel/network IP testing

#### Auto-Restart Commands:
```bash
# Stop current server (Ctrl+C) then restart:
npm run dev

# Or use auto-restart for .env changes:
npm run dev:auto-restart
```

#### Testing Workflow with Auto-Restart:
1. Make environment changes (IP/URL updates)
2. **ALWAYS restart dev server** - environment variables only load on startup
3. Test email signature links from external devices
4. Verify PDF generation works with new URLs

**Remember**: Next.js only reads environment variables at startup, so restart is mandatory for testing!
- PDF generation and signature processes are tested through the Cloudflare tunnel

## Architecture Overview

This is a Next.js application for a motorbike rental management system (PBikeRescue Rails) with the following architecture:

### Core Stack
- **Framework**: Next.js 15.3.3 with TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with email link authentication
- **Storage**: Firebase Storage
- **AI Integration**: Google Genkit for AI-powered email generation
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Forms**: React Hook Form with Zod validation

### Key Directories
- `src/app/` - Next.js app router pages and API routes
  - `(app)/` - Main application pages (cases, fleet, contacts, etc.)
  - `api/` - API endpoints for webhooks, document signing, email/SMS
- `src/components/` - Reusable UI components (using shadcn/ui pattern)
- `src/lib/` - Core utilities and Firebase services
- `src/context/` - React context providers (AuthContext)
- `src/ai/` - Genkit AI flows for email generation

### Important Files
- `src/lib/firebase.ts` - Firebase initialization and configuration
- `src/lib/firebase-schema-complete.ts` - Complete TypeScript schema definitions
- `src/lib/firebase-services.ts` - Firebase service layer implementation
- `src/context/AuthContext.tsx` - Authentication state management

### Core Features
1. **Case Management** - Track motorbike rental cases with status progression
2. **Fleet Tracking** - Manage bike inventory and assignments
3. **Financial Records** - Handle transactions and financial tracking
4. **AI Email Generation** - Generate collection emails with varying tones
5. **Document Management** - Store and manage case-related documents
6. **Insurance Management** - Store insurance provider details
7. **Subscription Management** - User subscription handling

### Environment Configuration
The app uses Firebase configuration from environment variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Security Note
Current Firestore rules (`firestore.rules`) allow all read/write access for development. These should be properly configured before production deployment.

## Project Overview: Motorbike Rental Management System

This is a comprehensive web application for managing a motorbike rental business that specializes in providing replacement vehicles to not-at-fault (NAF) victims of accidents. The system manages the entire case lifecycle, from client intake to final payment recovery from the at-fault (AF) party's insurer.

### Core Data Structure

The system revolves around several key data entities:

- **Case**: The central entity, containing all information related to an accident claim. It stores details for the NAF client, the AF party, accident specifics, case status, assigned bike, and a denormalized financial summary (invoiced, settled, paid). A unique case number (WWMM###) is auto-generated.

- **Bike**: Represents a motorcycle in the fleet. It tracks the bike's make, model, registration, service history, and assigned_case status.

- **BikeAssignment**: A linking table that connects a Bike to a Case. It specifies the rental period (assigned_date, returned_date) and the daily rental rates.

- **FinancialRecord**: Stores detailed financial transactions for each case, tracking amounts invoiced, settled, and paid over time.

- **Document**: Manages all files associated with a case, such as uploaded PDFs and images.

- **DigitalSignature Entities** (SignatureToken, RentalAgreement, DigitalSignature): These entities manage the secure e-signature process for rental agreements. They handle token generation, form data, and capture legally-compliant signature details (IP, user agent, timestamp).

- **Supporting Entities**: Insurance, CollectionsClient, CommunicationLog, Contact, and Workspace entities are used to manage related data and contacts.

### Key Functional Modules

1. **Dashboard**: The main landing page providing a real-time financial overview (Total Invoiced, Paid, Outstanding) and key statistics (Total Cases, Available Bikes).

2. **Cases Management**: The core of the application.
   - List View: A searchable and filterable grid of all cases, showing key details and status.
   - Create/Edit View: A comprehensive form to input and update all case information (NAF/AF details, accident info, financials).
   - Detail View: A consolidated view of a single case, providing access to financials, document uploads, communication logs, and follow-up notes.

3. **Bike Fleet Management**:
   - Manages the inventory of all motorbikes.
   - Includes functionality to assign an available bike to a case and to process a bike's return, which triggers the final rental cost calculation.

4. **Document & E-Signature Module**:
   - Allows admins to upload and manage case-related documents.
   - Features a secure workflow to send documents (like the Rental Agreement) for digital signature. This involves generating a secure, time-limited link, sending it via Email/SMS, and capturing the signature on a dedicated portal.
   - Integrates with JotForm for specific forms, using URL pre-filling and webhooks to retrieve the final signed PDF.

5. **Financials & Collections**:
   - Provides a dedicated financial overview page with monthly and financial-year reporting.
   - Manages outstanding accounts by allowing cases to be assigned to a collections client and facilitating the sending of templated demand letters.

### Critical Business Workflows

1. **New Case Creation**: An admin enters NAF and AF party details. The system generates a unique case number and checks for duplicate vehicle registrations to prevent errors.

2. **Bike Assignment & Rental Calculation**: An available bike is assigned to a case with specified daily rates. The system tracks the number of days the bike is on hire and calculates the total rental cost upon return.

3. **Digital Signature Flow**:
   - Admin initiates a signature request for a case.
   - A unique, secure token (SHA256) is generated.
   - A link containing the token is sent to the client.
   - The client accesses a secure portal, reviews the document, and provides a digital signature.
   - The system captures the signature, IP address, and user agent, then generates a final PDF. This PDF is emailed to the business and stored against the case.

4. **Financial Settlement**: After a bike is returned, the final invoice is calculated. The admin enters the Settlement Agreed amount negotiated with the insurer. Payments are recorded against this amount until the Outstanding balance is zero and the case can be Closed.

### Technical Specifications & Integrations

- **Frontend**: Next.js (React)
- **Backend & Database**: Firebase (Firestore, Authentication, Cloud Functions)
- **Styling**: Tailwind CSS
- **Key External Integrations**:
  - **Brevo** (formerly Sendinblue): For transactional emails and SMS messages.
  - **JotForm**: For handling specific forms via API and webhooks.
  - **Google Drive**: For automatic backup of signed documents.
  - **Stripe**: For internal business subscription management only (not for case payments).

## Code Health Improvement Tasks

Based on the code health analysis, the following tasks should be completed to improve code quality, security, and maintainability:

### 🔴 Critical Priority (Fix Immediately)

#### Security & Configuration
- [ ] **Fix Firebase Security Rules**: Replace open rules in `firestore.rules` and `storage.rules` with proper authentication-based rules
- [ ] **Update npm dependencies**: Run `npm audit fix` to address 3 security vulnerabilities (1 critical, 1 moderate, 1 low)
- [ ] **Add environment validation**: Ensure all required environment variables are validated at startup

#### TypeScript & Build Issues
- [ ] **Fix 28 TypeScript errors**: Address all compilation errors to ensure builds work properly
  - Fix missing type exports and imports (Case, Contact, CaseFrontend types)
  - Resolve type mismatches in case management functions
  - Add missing module declarations
  - Replace unsafe `any` types with proper typing
- [ ] **Fix duplicate object properties**: Resolve object literal duplicate property errors

### 🟡 High Priority (Next Sprint)

#### Code Quality & Logging
- [ ] **Implement structured logging**: Replace 426+ console.log statements with proper logging library
- [ ] **Add error boundaries**: Implement React error boundaries for better error handling
- [ ] **Fix TypeScript unsafe patterns**: Address 68 files with `any`, `unknown`, or TypeScript ignore directives
- [ ] **Standardize error handling**: Create consistent error handling patterns across API routes

#### Testing & Quality Assurance
- [ ] **Expand test coverage**: Current coverage is minimal (3 test files for 175 source files)
  - Add unit tests for core business logic
  - Add integration tests for API endpoints
  - Add component tests for critical UI components
- [ ] **Add code quality tools**: 
  - Configure Prettier for consistent formatting
  - Add additional ESLint rules for code quality
  - Set up pre-commit hooks for code quality checks

### 🟢 Medium Priority (Future Sprints)

#### Performance & Database
- [ ] **Add Firestore indexes**: Define proper indexes in `firestore.indexes.json` for query performance
- [ ] **Optimize React components**: Add memoization where appropriate to prevent unnecessary re-renders
- [ ] **Implement code splitting**: Use dynamic imports for better bundle optimization
- [ ] **Add performance monitoring**: Implement monitoring for slow queries and operations

#### Developer Experience
- [ ] **Add API documentation**: Document all API endpoints with OpenAPI/Swagger
- [ ] **Improve development setup**: Add better onboarding documentation and scripts
- [ ] **Add debugging tools**: Implement better debugging tools for development
- [ ] **Create component documentation**: Document reusable components with Storybook or similar

#### Infrastructure & DevOps
- [ ] **Set up CI/CD pipeline**: Automate testing, linting, and deployment
- [ ] **Add health checks**: Implement application health monitoring
- [ ] **Set up staging environment**: Create proper staging deployment for testing
- [ ] **Add database backups**: Implement automated backup strategy for Firestore

### Completion Tracking
Use this checklist to track progress on code health improvements. Mark items as complete with `[x]` when finished.

**Current Health Score: 6.5/10**
**Target Health Score: 9.0/10**

## 🔥 CRITICAL: Firebase to SQLite Schema Conflicts

### Current State Analysis

The codebase is in a **conflicted state** due to an incomplete migration from Firebase to SQLite. This is causing:

- **47 files still importing Firebase** modules while using SQLite database
- **Mismatched schema definitions** between Firebase schema and SQLite implementation  
- **Type conflicts** causing 28+ TypeScript compilation errors
- **Dual database systems** causing data inconsistency risks

### Schema Conflict Details

#### Current Problematic Files:
- `src/lib/firebase-schema-complete.ts` - Contains SQLite schema but named as Firebase
- `src/lib/case-storage.ts` - Uses SQLite DB but imports Firebase types
- `src/lib/firebase-storage.ts` - Mock file storage system, not using Firebase
- 47+ component files importing Firebase types but connecting to SQLite

#### Architecture Confusion:
1. **Schema File Naming**: `firebase-schema-complete.ts` actually contains SQLite schema definitions
2. **Import Conflicts**: Files import from Firebase packages while using SQLite database
3. **Storage Confusion**: Firebase Storage references but using local file system
4. **Authentication Mixed**: Firebase Auth config exists but SQLite user tables defined

### Complete SQLite Refactor Plan

#### Phase 1: Schema & Database Layer (IMMEDIATE - Day 1)
- [ ] **Rename schema file**: `firebase-schema-complete.ts` → `database-schema.ts`
- [ ] **Remove all Firebase imports** from database layer files
- [ ] **Consolidate database interface**: Create single `DatabaseService` class
- [ ] **Update all schema imports** across 47+ files
- [ ] **Remove Firebase config** from Next.js config and environment

#### Phase 2: Service Layer Refactor (Day 2)
- [ ] **Refactor storage service**: Replace Firebase Storage with local file storage
- [ ] **Update authentication**: Replace Firebase Auth with SQLite-based user management
- [ ] **Consolidate database services**: Merge `case-storage.ts`, `server-storage.ts`, etc.
- [ ] **Remove Firebase dependencies** from package.json
- [ ] **Update API routes** to use SQLite exclusively

#### Phase 3: Component & UI Layer (Day 3)
- [ ] **Update all component imports**: Change Firebase schema imports to database schema
- [ ] **Fix TypeScript errors**: Resolve 28+ compilation errors from schema conflicts
- [ ] **Update form handlers**: Ensure all forms use SQLite data structures
- [ ] **Test data flow**: Verify complete data flow from UI to SQLite

#### Phase 4: Configuration & Cleanup (Day 4)
- [ ] **Remove Firebase rules files**: Delete `firestore.rules`, `storage.rules`, `firebase.json`
- [ ] **Update deployment**: Remove Firebase deployment configuration
- [ ] **Clean up environment**: Remove Firebase environment variables
- [ ] **Update documentation**: Reflect pure SQLite architecture
- [ ] **Final testing**: Comprehensive testing of all features

### Files Requiring Immediate Attention

#### High Priority (Schema Conflicts):
```
src/lib/firebase-schema-complete.ts     → src/lib/database-schema.ts
src/lib/case-storage.ts                 → Update imports
src/lib/firebase-storage.ts             → src/lib/file-storage.ts
src/lib/database.ts                     → Clean up Firebase references
```

#### Medium Priority (47 Component Files):
All files importing Firebase types need import updates:
- Case management components (15 files)
- Fleet management components (8 files) 
- Document handling components (12 files)
- API routes (12 files)

### Migration Script Strategy

Create automated migration scripts:
1. **Schema rename script**: Rename and update all imports
2. **Firebase cleanup script**: Remove all Firebase references
3. **TypeScript fix script**: Resolve compilation errors
4. **Test validation script**: Ensure all features work post-migration

### Risk Mitigation

- **Data backup**: Backup current SQLite database before migration
- **Feature testing**: Test each major feature after each phase
- **Rollback plan**: Maintain ability to rollback if issues arise
- **Documentation**: Document every change for future reference

### Success Criteria

✅ **Zero Firebase imports** in codebase  
✅ **All TypeScript errors resolved**  
✅ **Single database system** (SQLite only)  
✅ **All features functional** with SQLite  
✅ **Clean architecture** with proper separation  

This refactor will resolve the current schema conflicts and establish a clean, maintainable SQLite-based architecture.
## React Performance Optimization Guide

*Note: This site is no longer updated. Go to react.dev for the new React docs.*

These new documentation pages teach modern React:
- **memo**: Skipping re-rendering when props are unchanged

Internally, React uses several clever techniques to minimize the number of costly DOM operations required to update the UI. For many applications, using React will lead to a fast user interface without doing much work to specifically optimize for performance. Nevertheless, there are several ways you can speed up your React application.

### Use the Production Build

If you're benchmarking or experiencing performance problems in your React apps, make sure you're testing with the minified production build.

By default, React includes many helpful warnings. These warnings are very useful in development. However, they make React larger and slower so you should make sure to use the production version when you deploy the app.

If you aren't sure whether your build process is set up correctly, you can check it by installing React Developer Tools for Chrome. If you visit a site with React in production mode, the icon will have a dark background. If you visit a site with React in development mode, the icon will have a red background.

It is expected that you use the development mode when working on your app, and the production mode when deploying your app to the users.

#### Create React App
If your project is built with Create React App, run:
```bash
npm run build
```
This will create a production build of your app in the build/ folder of your project.

Remember that this is only necessary before deploying to production. For normal development, use `npm start`.

#### Single-File Builds
We offer production-ready versions of React and React DOM as single files:
```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
```
Remember that only React files ending with .production.min.js are suitable for production.

#### Brunch
For the most efficient Brunch production build, install the terser-brunch plugin:
```bash
# If you use npm
npm install --save-dev terser-brunch

# If you use Yarn
yarn add --dev terser-brunch
```
Then, to create a production build, add the -p flag to the build command:
```bash
brunch build -p
```
Remember that you only need to do this for production builds. You shouldn't pass the -p flag or apply this plugin in development, because it will hide useful React warnings and make the builds much slower.

#### Browserify
For the most efficient Browserify production build, install a few plugins:
```bash
# If you use npm
npm install --save-dev envify terser uglifyify

# If you use Yarn
yarn add --dev envify terser uglifyify
```
To create a production build, make sure that you add these transforms (the order matters):
- The envify transform ensures the right build environment is set. Make it global (-g).
- The uglifyify transform removes development imports. Make it global too (-g).
- Finally, the resulting bundle is piped to terser for mangling.

For example:
```bash
browserify ./index.js \
  -g [ envify --NODE_ENV production ] \
  -g uglifyify \
  | terser --compress --mangle > ./bundle.js
```
Remember that you only need to do this for production builds. You shouldn't apply these plugins in development because they will hide useful React warnings, and make the builds much slower.

#### Rollup
For the most efficient Rollup production build, install a few plugins:
```bash
# If you use npm
npm install --save-dev rollup-plugin-commonjs rollup-plugin-replace rollup-plugin-terser

# If you use Yarn
yarn add --dev rollup-plugin-commonjs rollup-plugin-replace rollup-plugin-terser
```
To create a production build, make sure that you add these plugins (the order matters):
- The replace plugin ensures the right build environment is set.
- The commonjs plugin provides support for CommonJS in Rollup.
- The terser plugin compresses and mangles the final bundle.

```javascript
plugins: [
  // ...
  require('rollup-plugin-replace')({
    'process.env.NODE_ENV': JSON.stringify('production')
  }),
  require('rollup-plugin-commonjs')(),
  require('rollup-plugin-terser')(),
  // ...
]
```
For a complete setup example see this gist.

Remember that you only need to do this for production builds. You shouldn't apply the terser plugin or the replace plugin with 'production' value in development because they will hide useful React warnings, and make the builds much slower.

#### webpack
*Note: If you're using Create React App, please follow the instructions above. This section is only relevant if you configure webpack directly.*

Webpack v4+ will minify your code by default in production mode.
```javascript
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  optimization: {
    minimizer: [new TerserPlugin({ /* additional options here */ })],
  },
};
```
You can learn more about this in webpack documentation.

Remember that you only need to do this for production builds. You shouldn't apply TerserPlugin in development because it will hide useful React warnings, and make the builds much slower.

### Profiling Components with the DevTools Profiler

react-dom 16.5+ and react-native 0.57+ provide enhanced profiling capabilities in DEV mode with the React DevTools Profiler. An overview of the Profiler can be found in the blog post "Introducing the React Profiler". A video walkthrough of the profiler is also available on YouTube.

If you haven't yet installed the React DevTools, you can find them here:
- Chrome Browser Extension
- Firefox Browser Extension
- Standalone Node Package

*Note: A production profiling bundle of react-dom is also available as react-dom/profiling. Read more about how to use this bundle at fb.me/react-profiling*

*Note: Before React 17, we use the standard User Timing API to profile components with the chrome performance tab. For a more detailed walkthrough, check out this article by Ben Schwarz.*

### Virtualize Long Lists

If your application renders long lists of data (hundreds or thousands of rows), we recommend using a technique known as "windowing". This technique only renders a small subset of your rows at any given time, and can dramatically reduce the time it takes to re-render the components as well as the number of DOM nodes created.

`react-window` and `react-virtualized` are popular windowing libraries. They provide several reusable components for displaying lists, grids, and tabular data. You can also create your own windowing component, like Twitter did, if you want something more tailored to your application's specific use case.

### Avoid Reconciliation

React builds and maintains an internal representation of the rendered UI. It includes the React elements you return from your components. This representation lets React avoid creating DOM nodes and accessing existing ones beyond necessity, as that can be slower than operations on JavaScript objects. Sometimes it is referred to as a "virtual DOM", but it works the same way on React Native.

When a component's props or state change, React decides whether an actual DOM update is necessary by comparing the newly returned element with the previously rendered one. When they are not equal, React will update the DOM.

Even though React only updates the changed DOM nodes, re-rendering still takes some time. In many cases it's not a problem, but if the slowdown is noticeable, you can speed all of this up by overriding the lifecycle function `shouldComponentUpdate`, which is triggered before the re-rendering process starts. The default implementation of this function returns true, leaving React to perform the update:

```javascript
shouldComponentUpdate(nextProps, nextState) {
  return true;
}
```

If you know that in some situations your component doesn't need to update, you can return false from shouldComponentUpdate instead, to skip the whole rendering process, including calling render() on this component and below.

In most cases, instead of writing shouldComponentUpdate() by hand, you can inherit from React.PureComponent. It is equivalent to implementing shouldComponentUpdate() with a shallow comparison of current and previous props and state.

#### shouldComponentUpdate In Action

Here's a subtree of components. For each one, SCU indicates what shouldComponentUpdate returned, and vDOMEq indicates whether the rendered React elements were equivalent. Finally, the circle's color indicates whether the component had to be reconciled or not.

Since shouldComponentUpdate returned false for the subtree rooted at C2, React did not attempt to render C2, and thus didn't even have to invoke shouldComponentUpdate on C4 and C5.

For C1 and C3, shouldComponentUpdate returned true, so React had to go down to the leaves and check them. For C6 shouldComponentUpdate returned true, and since the rendered elements weren't equivalent React had to update the DOM.

The last interesting case is C8. React had to render this component, but since the React elements it returned were equal to the previously rendered ones, it didn't have to update the DOM.

Note that React only had to do DOM mutations for C6, which was inevitable. For C8, it bailed out by comparing the rendered React elements, and for C2's subtree and C7, it didn't even have to compare the elements as we bailed out on shouldComponentUpdate, and render was not called.

#### Examples

If the only way your component ever changes is when the props.color or the state.count variable changes, you could have shouldComponentUpdate check that:

```javascript
class CounterButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {count: 1};
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.color !== nextProps.color) {
      return true;
    }
    if (this.state.count !== nextState.count) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <button
        color={this.props.color}
        onClick={() => this.setState(state => ({count: state.count + 1}))}>
        Count: {this.state.count}
      </button>
    );
  }
}
```

In this code, shouldComponentUpdate is just checking if there is any change in props.color or state.count. If those values don't change, the component doesn't update. If your component got more complex, you could use a similar pattern of doing a "shallow comparison" between all the fields of props and state to determine if the component should update. This pattern is common enough that React provides a helper to use this logic - just inherit from React.PureComponent. So this code is a simpler way to achieve the same thing:

```javascript
class CounterButton extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {count: 1};
  }

  render() {
    return (
      <button
        color={this.props.color}
        onClick={() => this.setState(state => ({count: state.count + 1}))}>
        Count: {this.state.count}
      </button>
    );
  }
}
```

Most of the time, you can use React.PureComponent instead of writing your own shouldComponentUpdate. It only does a shallow comparison, so you can't use it if the props or state may have been mutated in a way that a shallow comparison would miss.

This can be a problem with more complex data structures. For example, let's say you want a ListOfWords component to render a comma-separated list of words, with a parent WordAdder component that lets you click a button to add a word to the list. This code does not work correctly:

```javascript
class ListOfWords extends React.PureComponent {
  render() {
    return <div>{this.props.words.join(',')}</div>;
  }
}

class WordAdder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      words: ['marklar']
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    // This section is bad style and causes a bug
    const words = this.state.words;
    words.push('marklar');
    this.setState({words: words});
  }

  render() {
    return (
      <div>
        <button onClick={this.handleClick} />
        <ListOfWords words={this.state.words} />
      </div>
    );
  }
}
```

The problem is that PureComponent will do a simple comparison between the old and new values of this.props.words. Since this code mutates the words array in the handleClick method of WordAdder, the old and new values of this.props.words will compare as equal, even though the actual words in the array have changed. The ListOfWords will thus not update even though it has new words that should be rendered.

### The Power Of Not Mutating Data

The simplest way to avoid this problem is to avoid mutating values that you are using as props or state. For example, the handleClick method above could be rewritten using concat as:

```javascript
handleClick() {
  this.setState(state => ({
    words: state.words.concat(['marklar'])
  }));
}
```

ES6 supports a spread syntax for arrays which can make this easier. If you're using Create React App, this syntax is available by default.

```javascript
handleClick() {
  this.setState(state => ({
    words: [...state.words, 'marklar'],
  }));
};
```

You can also rewrite code that mutates objects to avoid mutation, in a similar way. For example, let's say we have an object named colormap and we want to write a function that changes colormap.right to be 'blue'. We could write:

```javascript
function updateColorMap(colormap) {
  colormap.right = 'blue';
}
```

To write this without mutating the original object, we can use Object.assign method:

```javascript
function updateColorMap(colormap) {
  return Object.assign({}, colormap, {right: 'blue'});
}
```

updateColorMap now returns a new object, rather than mutating the old one. Object.assign is in ES6 and requires a polyfill.

Object spread syntax makes it easier to update objects without mutation as well:

```javascript
function updateColorMap(colormap) {
  return {...colormap, right: 'blue'};
}
```

This feature was added to JavaScript in ES2018.

If you're using Create React App, both Object.assign and the object spread syntax are available by default.

When you deal with deeply nested objects, updating them in an immutable way can feel convoluted. If you run into this problem, check out Immer or immutability-helper. These libraries let you write highly readable code without losing the benefits of immutability.