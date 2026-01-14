# Notion Reader - Development Roadmap

## Completed (v1.0)

- [x] Article list with grid/list views
- [x] Article reader with markdown rendering
- [x] Text highlighting with color options
- [x] Notion integration for article storage
- [x] User authentication with sessions
- [x] Dark/light theme support
- [x] Search and filter by status/tags
- [x] Favourite articles
- [x] Responsive design

---

## Short-term Improvements (v1.1)

### User Experience
- [ ] **Highlights-only view**: Display only highlighted passages from an article
- [ ] **Keyboard shortcuts**: Navigation (j/k for next/prev article), reading (h for highlight)
- [ ] **Reading progress indicator**: Show how much of an article has been read
- [ ] **Estimated reading position**: Remember where user left off

### Performance
- [ ] **Lazy loading**: Load article content on scroll for long articles
- [ ] **Image optimization**: Use Next.js Image component for cover images
- [ ] **Skeleton loading states**: Better loading experience

### Bug Fixes
- [ ] Handle Notion API rate limiting with exponential backoff
- [ ] Better error messages for failed operations
- [ ] Fix highlight overlap edge cases

---

## Medium-term Features (v1.2)

### Content Management
- [ ] **Full-text search**: Search within article content
- [ ] **Tags management UI**: Create, edit, delete tags from the app
- [ ] **Bulk operations**: Archive/delete multiple articles at once
- [ ] **Article sorting**: By date, reading time, title, author

### Export & Sharing
- [ ] **Export highlights**: Download as Markdown or JSON
- [ ] **Export article**: Save article with highlights as PDF
- [ ] **Share highlights**: Generate shareable links for highlight collections

### Reading Experience
- [ ] **Font customization**: Size, family, line height
- [ ] **Reading themes**: Sepia, high contrast, custom colors
- [ ] **Text-to-speech**: Listen to articles
- [ ] **Reading statistics**: Track reading time, articles per week

---

## Long-term Vision (v2.0)

### Multi-user Support
- [ ] User registration and onboarding
- [ ] Personal Notion database per user
- [ ] User preferences sync
- [ ] Reading lists sharing between users

### Browser Extension
- [ ] Chrome/Firefox extension for saving articles
- [ ] One-click save from any webpage
- [ ] Article content extraction (like Readability)
- [ ] Quick highlight from browser

### Mobile & Offline
- [ ] Progressive Web App (PWA) support
- [ ] Offline reading with Service Workers
- [ ] Mobile-optimized touch gestures
- [ ] Push notifications for reading reminders

### Advanced Features
- [ ] **Note-taking**: Add personal notes alongside highlights
- [ ] **AI summarization**: Generate summaries for saved articles
- [ ] **Related articles**: Suggest similar content based on tags/highlights
- [ ] **Reading goals**: Set and track reading targets
- [ ] **Integration**: Connect with Readwise, Pocket, Instapaper

### Alternative Backends
- [ ] Self-hosted database option (PostgreSQL)
- [ ] Obsidian vault integration
- [ ] Local file storage option

---

## Technical Debt

### Code Quality
- [ ] Add unit tests for Notion integration
- [ ] Add E2E tests with Playwright
- [ ] Set up CI/CD pipeline
- [ ] Add error boundaries to React components

### Infrastructure
- [ ] Add proper logging (not console.log)
- [ ] Set up monitoring and alerts
- [ ] Add rate limiting to API routes
- [ ] Implement proper caching strategy

### Documentation
- [x] Architecture documentation
- [x] API documentation
- [ ] Contributing guidelines
- [ ] Deployment guide for self-hosting

---

## Next Steps

1. Review code and test locally
2. Commit changes to personal GitHub repo
3. Deploy to Vercel (or alternative)
4. Begin v1.1 features starting with highlights-only view

---

## Training Notes

Areas to improve development skills:
- Guardrails and input validation
- Context management and code quality
- TypeScript advanced patterns
- Node.js best practices
# Next step
1. Review code
2. Demo version and local test
3. Commit su new repo github perso
4. Pull e deployment su v0 personale (o alternative?)

# Other possible features
1. Visualizzare solo highlights
2. 

# Training
1. guardrails
2. Context e indicazioni su come migliorare il codice
3. typescript e node js
