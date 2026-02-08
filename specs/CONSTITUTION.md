# BSR Method - Project Constitution

> AI-driven development framework integrating BMAD, SpecKit, and Ralph

## Purpose

This document defines the governing principles and standards for BSR Method.
All specifications and implementations must adhere to these principles.

## Core Principles

### 1. User-Centric Design
- All features serve the needs of: Solo developers using AI-assisted development,Small teams wanting structured LLM-driven workflows,Developers working on greenfield and brownfield projects
- User experience takes priority over technical convenience
- Accessibility is a requirement, not an afterthought

### 2. Code Quality
- TypeScript strict mode enabled
- All public APIs documented
- Test coverage minimum: 80%
- No any types without explicit justification

### 3. Performance
- Response time target: < 200ms
- Bundle size awareness
- Lazy loading where appropriate

### 4. Security
- Input validation on all user data
- No secrets in code
- Principle of least privilege

### 5. Maintainability
- Clear separation of concerns
- Consistent naming conventions
- Self-documenting code preferred

## Technical Standards

### Naming Conventions
- Files: kebab-case (e.g., `user-service.ts`)
- Classes: PascalCase (e.g., `UserService`)
- Functions: camelCase (e.g., `getUserById`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRIES`)

### File Structure
```
src/
├── core/           # Business logic (no I/O)
├── services/       # External integrations
├── api/            # API handlers
├── utils/          # Pure utility functions
└── types/          # TypeScript types
```

### Error Handling
- Use typed errors (custom Error classes)
- Always handle Promise rejections
- Log errors with context

### Testing
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical paths

## Definition of Done

A feature is complete when:
- [ ] All acceptance criteria met
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No TypeScript errors
- [ ] No linting warnings

## Change Process

1. Create specification in `specs/features/`
2. Review specification
3. Implement feature
4. Write tests
5. Update documentation
6. Submit for review

---
*BSR Method - SpecKit Constitution*
