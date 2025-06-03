# Global cache that will be populated from app.py
_agent_instructions_cache = {}

def set_agent_instructions(agent_name, instructions):
    """Set agent instructions in cache"""
    global _agent_instructions_cache
    _agent_instructions_cache[agent_name] = instructions
    print(f"Cached instructions for {agent_name}")

def get_agent_instructions(agent_name):
    """Get agent instructions from cache"""
    global _agent_instructions_cache
    
    instructions = _agent_instructions_cache.get(agent_name)
    if instructions:
        print(f"Found cached instructions for {agent_name}")
        return instructions
    else:
        print(f"No cached instructions found for {agent_name}")
        return None