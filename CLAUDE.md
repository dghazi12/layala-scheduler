See [PROJECT.md](PROJECT.md) and [CLAUDE.md](CLAUDE.md) for project context.

## Conventions

- Tailwind core utilities only, no arbitrary values
- Scheduling logic stays as pure functions — data in, data out, no React. This
  is the most important structural rule here: restaurant rules change constantly
  and the logic needs to stay testable in isolation.
- Slate/teal palette; rose for gaps, amber for rule violations
- Copy is plain and active: "Build the week", not "Generate Schedule"
