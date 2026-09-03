"""
Dice System for Online Fantasy Tabletop RPG
Server-authoritative dice rolling engine.
Supports d4, d6, d8, d10, d12, d20, d100 with modifiers.
"""

import random
from typing import List, Dict, Any, Optional

SUPPORTED_DICE = [4, 6, 8, 10, 12, 20, 100]

class DiceRollResult:
    def __init__(
        self,
        die_type: int,
        count: int,
        rolls: List[int],
        modifier: int = 0,
        label: str = ""
    ):
        self.die_type = die_type
        self.count = count
        self.rolls = rolls
        self.modifier = modifier
        self.label = label
        self.subtotal = sum(rolls)
        self.total = self.subtotal + modifier
        self.is_critical_success = (die_type == 20 and count == 1 and rolls[0] == 20)
        self.is_critical_fail = (die_type == 20 and count == 1 and rolls[0] == 1)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "die_type": f"d{self.die_type}",
            "count": self.count,
            "rolls": self.rolls,
            "subtotal": self.subtotal,
            "modifier": self.modifier,
            "total": self.total,
            "is_critical_success": self.is_critical_success,
            "is_critical_fail": self.is_critical_fail,
            "label": self.label,
            "breakdown": f"{self.count}d{self.die_type} ({'+'.join(map(str, self.rolls))}) {'+' if self.modifier >= 0 else '-'} {abs(self.modifier)} = {self.total}"
        }


def roll_die(sides: int, count: int = 1, modifier: int = 0, label: str = "", rng: Optional[random.Random] = None) -> DiceRollResult:
    """
    Rolls count dice with the specified number of sides, adds modifier.
    Server-authoritative calculation.
    """
    if sides not in SUPPORTED_DICE:
        raise ValueError(f"Unsupported die type: d{sides}. Must be one of: {SUPPORTED_DICE}")
    if count < 1 or count > 20:
        raise ValueError("Count must be between 1 and 20 dice.")
    
    roller = rng if rng is not None else random.Random()
    rolls = [roller.randint(1, sides) for _ in range(count)]
    return DiceRollResult(die_type=sides, count=count, rolls=rolls, modifier=modifier, label=label)
