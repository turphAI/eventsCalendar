# Calendar Sync - Responsibility Breakdown

This document clarifies which parts of the project are best handled by AI assistance, you (the user), or in collaboration.

---

## General Principles

**AI (Claude) is best at:**
- Writing code, debugging, and technical implementation
- API integrations and technical documentation
- Setting up infrastructure and deployment configurations
- Technical problem-solving and architecture decisions
- Creating boilerplate and scaffolding code

**You (UX Designer) are best at:**
- UX/UI design decisions and visual design
- Testing with your actual email accounts and real-world scenarios
- Validating that the experience matches your workflow
- Defining what "feels right" and providing feedback
- Understanding your personal communication patterns and preferences

**Collaboration works best for:**
- Refining Claude prompts based on real results
- Iterating on the iOS app UI based on actual usage
- Making decisions where technical constraints meet UX goals
- Defining edge cases and how to handle them
- Balancing features vs. simplicity

---

## Backend Development

### Vercel Project Setup
- **AI**: Set up Vercel project structure, configuration files, deployment scripts
- **You**: Provide Vercel account access, decide on project name/domain
- **Collaboration**: Review setup and ensure it matches your preferences

### Gmail API Integration
- **AI**: Write OAuth flow, API client code, message retrieval logic
- **You**: Create Gmail OAuth credentials in Google Cloud Console, provide test account access
- **Collaboration**: Test with real emails, refine what messages to process (inbox only? labels? filters?)

### iCloud Mail API Integration
- **AI**: Research and implement iCloud Mail API (less documented, may need creative solutions)
- **You**: Provide iCloud account access for testing, create Apple Developer credentials if needed
- **Collaboration**: Navigate iCloud Mail API limitations together, decide on fallback approaches

### Claude API Integration
- **AI**: Write API client code, create initial system prompts, handle API errors/retries
- **You**: Provide feedback on extraction quality from real messages
- **Collaboration**: **CRITICAL** - Iteratively refine prompts based on your actual email patterns and communication style

### Database Schema & Setup
- **AI**: Design and implement Vercel Postgres schema, write migration scripts
- **You**: Provide input on what data you want tracked/stored
- **Collaboration**: Decide what to log (rejected events? confidence scores? user edits?)

### Firebase Cloud Messaging
- **AI**: Set up Firebase project config, write backend notification sending code
- **You**: Create Firebase project in console, provide iOS device token for testing
- **Collaboration**: Refine notification content/preview text based on what helps you decide

### Message Polling & Scheduling
- **AI**: Implement polling logic, error handling, rate limiting
- **You**: Test and provide feedback on responsiveness vs. battery/API quota tradeoffs
- **Collaboration**: Decide polling frequency (every 2 min? 5 min? configurable?)

---

## iOS App Development

### SwiftUI Project Setup
- **AI**: Create Xcode project structure, set up dependencies, configure Info.plist
- **You**: Provide Apple Developer account, TestFlight access
- **Collaboration**: Review project structure and naming conventions

### Firebase iOS Integration
- **AI**: Set up Firebase SDK, write notification handling code, device token registration
- **You**: Test notification delivery on your actual iPhone
- **Collaboration**: Refine notification appearance, sounds, and interaction patterns

### Notification UI & Handling
- **AI**: Implement notification display logic, deep linking from notification to app
- **You**: **PRIMARY** - Design what the notification preview should show, define the "tap to review" flow
- **Collaboration**: Test notification content and timing, refine based on real-world usage

### Event Review Screen
- **AI**: Write SwiftUI code for displaying event data, implement approve/reject/edit buttons
- **You**: **PRIMARY** - Design the visual layout, information hierarchy, button placement, typography
- **Collaboration**: Iterate on UI based on real event examples, refine spacing and visual polish

### Edit Functionality
- **AI**: Implement event editing UI (date picker, time picker, text fields), validation logic
- **You**: Design the edit flow - is it a modal? inline? what fields can be edited?
- **Collaboration**: Balance edit capability with simplicity (how much editing is needed?)

### EventKit Integration (Apple Calendar)
- **AI**: Write EventKit code to request permissions, create calendar events, handle errors
- **You**: Test calendar integration with your actual Apple Calendar, verify sync to Google Calendar works
- **Collaboration**: Debug any sync issues, decide which calendar to write to (default calendar? user choice?)

### Confirmation & Feedback Screens
- **AI**: Implement confirmation screen UI, navigation to Calendar app
- **You**: Design the confirmation experience - what's the feedback? how does user proceed?
- **Collaboration**: Test the full approval flow and refine based on feel

### Settings/Preferences Screen
- **AI**: Build settings UI, implement preference storage
- **You**: **PRIMARY** - Design what settings are needed, how they're organized, what's configurable
- **Collaboration**: Decide what should be configurable vs. hardcoded (notification frequency, accounts to monitor, etc.)

---

## Claude Prompt Engineering

### Initial System Prompt
- **AI**: Write initial prompt based on requirements
- **You**: Provide examples of your actual emails/messages that contain events
- **Collaboration**: **CRITICAL** - Refine together based on real examples, your communication style, false positives/negatives

### Extraction Quality
- **AI**: Structure the prompt to return consistent JSON, handle edge cases in code
- **You**: Test with real messages, flag when extraction is wrong or missing details
- **Collaboration**: **ONGOING** - Continuously improve prompts based on your feedback and real-world accuracy

### Confidence Scoring
- **AI**: Implement confidence level handling in code, UI states for low confidence
- **You**: Decide what confidence level triggers "needs review" UI
- **Collaboration**: Test with ambiguous messages, refine confidence thresholds

---

## Testing & Validation

### Unit Tests & Technical Testing
- **AI**: Write tests for API integrations, error handling, data parsing
- **You**: Review test coverage, provide edge case scenarios
- **Collaboration**: Define what scenarios need testing

### Real-World Testing
- **AI**: Set up test data, create mock scenarios
- **You**: **PRIMARY** - Test with your actual Gmail and iCloud accounts, real emails, real calendar events
- **Collaboration**: Review test results, identify issues, prioritize fixes

### User Experience Testing
- **AI**: Help implement analytics/logging to track usage patterns
- **You**: **PRIMARY** - Use the app in real life, provide feedback on what works/doesn't work
- **Collaboration**: Analyze usage data together, make iterative improvements

---

## UX/UI Design

### Visual Design
- **You**: **PRIMARY** - All visual design decisions, color palette, typography, spacing, icons
- **AI**: Implement your designs in SwiftUI code
- **Collaboration**: Discuss technical constraints and design alternatives

### Interaction Design
- **You**: **PRIMARY** - Define user flows, interaction patterns, micro-interactions
- **AI**: Implement the interactions in code
- **Collaboration**: Test interactions, refine based on feel and technical feasibility

### Notification Design
- **You**: **PRIMARY** - Design notification preview content, timing, grouping strategy
- **AI**: Implement notification formatting and delivery logic
- **Collaboration**: Test notification effectiveness, refine preview text

### Information Architecture
- **You**: **PRIMARY** - Decide what information to show, in what order, what's optional
- **AI**: Implement the information display in code
- **Collaboration**: Refine based on usability testing

---

## Deployment & DevOps

### Backend Deployment
- **AI**: Set up Vercel deployment, environment variables, secrets management
- **You**: Provide API keys, OAuth credentials, review deployment settings
- **Collaboration**: Ensure security best practices, decide on staging vs. production

### iOS App Distribution
- **AI**: Set up TestFlight configuration, build scripts, app metadata
- **You**: Handle App Store Connect submission, App Store listing, screenshots
- **Collaboration**: Test TestFlight builds, refine before App Store submission

### Monitoring & Logging
- **AI**: Set up error tracking, logging infrastructure, monitoring dashboards
- **You**: Review logs when issues occur, provide feedback on what's broken
- **Collaboration**: Define what to monitor, set up alerts for critical issues

---

## Decision Making

### Technical Architecture Decisions
- **AI**: Provide options and recommendations (e.g., polling vs. webhooks, database choices)
- **You**: Make final decisions based on your priorities (simplicity, cost, performance)
- **Collaboration**: Discuss tradeoffs, choose together

### Feature Prioritization
- **You**: **PRIMARY** - Define what features matter most, what can wait
- **AI**: Provide technical complexity estimates, suggest alternatives
- **Collaboration**: Balance feature scope with timeline and technical constraints

### Edge Case Handling
- **AI**: Identify technical edge cases, propose solutions
- **You**: Identify UX edge cases based on your real-world usage
- **Collaboration**: **CRITICAL** - Decide together how to handle edge cases (ignore, handle gracefully, show error)

---

## Documentation

### Technical Documentation
- **AI**: Write code comments, API documentation, setup instructions
- **You**: Review for clarity, provide feedback on what's missing
- **Collaboration**: Ensure documentation matches your understanding and workflow

### User Documentation
- **AI**: Draft user-facing documentation based on the app
- **You**: **PRIMARY** - Write user-friendly documentation, help text, onboarding
- **Collaboration**: Review and refine together

---

## Key Collaboration Points

### Most Important Areas for Collaboration:

1. **Claude Prompt Refinement** - This is iterative and requires your feedback on real messages
2. **iOS UI/UX Iteration** - Design needs your expertise, implementation needs my code
3. **Edge Case Handling** - Technical possibilities meet your real-world needs
4. **Testing & Validation** - You test with real accounts, we fix issues together
5. **Feature Prioritization** - Your priorities meet technical constraints

### Areas Where You Lead:

- All visual design and UI layout
- UX flow decisions and interaction patterns
- Testing with your actual accounts and real-world scenarios
- Defining what "feels right" and providing qualitative feedback
- User-facing documentation and help text

### Areas Where AI Leads:

- Code implementation and technical setup
- API integrations and error handling
- Infrastructure and deployment configuration
- Technical problem-solving and debugging
- Code documentation and technical writing

---

## Recommended Workflow

1. **Start with Setup**: AI handles technical setup, you provide credentials/access
2. **Build Core Functionality**: AI writes code, you test with real accounts
3. **Design UI**: You design, AI implements, we iterate together
4. **Refine Prompts**: We collaborate closely on Claude prompt improvements
5. **Test & Iterate**: You use it daily, we refine based on your feedback
6. **Polish & Deploy**: AI handles technical polish, you handle App Store submission

---

## Questions to Clarify Together

As we work, we should discuss:

- What level of detail do you want in notifications? (Just title/time? Or full details?)
- How should the app handle multiple events from the same email?
- Should rejected events be logged for learning? Or just silently ignored?
- What happens if Claude extracts an event but you already have it in your calendar?
- How should the app handle recurring events mentioned in emails?
- What's the minimum viable notification frequency? (Real-time? Every 5 minutes?)
- Should the app show a history of processed events, or just current ones?
- How should the app handle events that need a response (e.g., "want to grab coffee?")

---

*This document should evolve as we work together and learn more about the project's needs.*

