from drill.actor import Actor, ActorAction


class TestActorAction:
    def test_parse_type_action(self):
        action = ActorAction.from_tool_result({"action": "type", "text": "create a worktree"})
        assert action.action == "type"
        assert action.text == "create a worktree"

    def test_parse_done_action(self):
        action = ActorAction.from_tool_result({"action": "done"})
        assert action.action == "done"

    def test_parse_stuck_action(self):
        action = ActorAction.from_tool_result({"action": "stuck"})
        assert action.action == "stuck"

    def test_parse_key_action(self):
        action = ActorAction.from_tool_result({"action": "key", "key": "ctrl-c"})
        assert action.action == "key"
        assert action.key == "ctrl-c"


class TestActorPrompt:
    def test_builds_system_prompt_naive(self):
        actor = Actor(model="claude-sonnet-4-6", temperature=0.7)
        prompt = actor.build_system_prompt(
            posture="naive",
            intents=["Ask the agent to create a worktree"],
        )
        assert "plain language" in prompt.lower() or "don't know" in prompt.lower()
        assert "create a worktree" in prompt

    def test_builds_system_prompt_spec_aware(self):
        actor = Actor(model="claude-sonnet-4-6", temperature=0.7)
        prompt = actor.build_system_prompt(
            posture="spec-aware",
            intents=["Use the worktree skill"],
        )
        assert "skill" in prompt.lower() or "convention" in prompt.lower()


class TestActorContext:
    def test_appends_terminal_captures(self):
        actor = Actor(model="claude-sonnet-4-6", temperature=0.7)
        actor.append_capture("Screen 1: Welcome to Claude")
        actor.append_capture("Screen 2: ❯ ")
        messages = actor.build_messages()
        assert len(messages) == 2
        assert "Screen 1" in messages[0]["content"]
        assert "Screen 2" in messages[1]["content"]
