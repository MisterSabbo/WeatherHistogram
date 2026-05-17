### Memory Persistence (MCP server)

1. On session start: `search_nodes` / `read_graph` to load context.
2. On creating components: `create_entities` + `create_relations`.
3. On task done: `add_observations` summarizing what was implemented, issues, and next step.
4. File/memory conflicts: prioritize memory data, consult user before destructive changes.
5. Don't mark "Complete" until memory server is updated.
