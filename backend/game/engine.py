"""
Core Python RPG game engine rules & data models.
Provides server-authoritative logic for characters, monsters, items, combat, and dice.
"""

import random
from typing import List, Dict, Optional, Tuple

DICE_SIDES = [4, 6, 8, 10, 12, 20, 100]


class DiceRoller:
    """Server-authoritative dice rolling engine."""

    @staticmethod
    def roll(sides: int, count: int = 1, modifier: int = 0) -> Dict:
        if sides not in DICE_SIDES:
            raise ValueError(f"Invalid die size: d{sides}. Supported: {DICE_SIDES}")
        if count < 1 or count > 50:
            raise ValueError(f"Dice count {count} must be between 1 and 50")

        rolls = [random.randint(1, sides) for _ in range(count)]
        subtotal = sum(rolls)
        total = subtotal + modifier

        is_crit_success = sides == 20 and count == 1 and rolls[0] == 20
        is_crit_fail = sides == 20 and count == 1 and rolls[0] == 1

        return {
            "die": f"d{sides}",
            "count": count,
            "rolls": rolls,
            "modifier": modifier,
            "subtotal": subtotal,
            "total": total,
            "is_crit_success": is_crit_success,
            "is_crit_fail": is_crit_fail,
        }


class CharacterModel:
    """Player Character entity with attributes, inventory, and vitals."""

    def __init__(
        self,
        char_id: str,
        name: str,
        race: str,
        class_type: str,
        level: int = 1,
        stats: Optional[Dict[str, int]] = None,
    ):
        self.id = char_id
        self.name = name
        self.race = race
        self.class_type = class_type
        self.level = level

        default_stats = {
            "strength": 14,
            "dexterity": 14,
            "constitution": 14,
            "intelligence": 10,
            "wisdom": 12,
            "charisma": 10,
        }
        self.stats = stats or default_stats

        con_mod = (self.stats["constitution"] - 10) // 2
        if class_type == "Warrior":
            self.max_hp = 24 + (con_mod * 2)
            self.max_mp = 6
            self.ac = 16
        elif class_type == "Mage":
            self.max_hp = 16 + con_mod
            self.max_mp = 20
            self.ac = 12
        else:  # Rogue
            self.max_hp = 18 + con_mod
            self.max_mp = 8
            self.ac = 15

        self.hp = self.max_hp
        self.mp = self.max_mp
        self.gold = 50
        self.xp = 0
        self.position = (2, 2)
        self.inventory: List[Dict] = []

    def take_damage(self, amount: int) -> int:
        self.hp = max(0, self.hp - amount)
        return self.hp

    def heal(self, amount: int) -> int:
        self.hp = min(self.max_hp, self.hp + amount)
        return self.hp

    def is_alive(self) -> bool:
        return self.hp > 0


class MonsterModel:
    """Monster entity for combat encounters."""

    def __init__(
        self,
        monster_id: str,
        name: str,
        monster_type: str,
        hp: int,
        ac: int,
        attack_mod: int,
        damage_dice: str,
        xp_reward: int,
        gold_reward: int,
    ):
        self.id = monster_id
        self.name = name
        self.type = monster_type
        self.max_hp = hp
        self.hp = hp
        self.ac = ac
        self.attack_modifier = attack_mod
        self.damage_dice = damage_dice
        self.xp_reward = xp_reward
        self.gold_reward = gold_reward
        self.position = (5, 5)

    def take_damage(self, amount: int) -> int:
        self.hp = max(0, self.hp - amount)
        return self.hp

    def is_alive(self) -> bool:
        return self.hp > 0


class CombatEngine:
    """Server-authoritative combat resolution."""

    @staticmethod
    def player_attack(attacker: CharacterModel, target: MonsterModel) -> Dict:
        stat_key = "strength" if attacker.class_type == "Warrior" else ("intelligence" if attacker.class_type == "Mage" else "dexterity")
        mod = (attacker.stats[stat_key] - 10) // 2

        attack_roll = DiceRoller.roll(20, 1, mod + attacker.level)
        is_hit = attack_roll["is_crit_success"] or (
            not attack_roll["is_crit_fail"] and attack_roll["total"] >= target.ac
        )

        if not is_hit:
            return {
                "hit": False,
                "attack_roll": attack_roll,
                "damage": 0,
                "target_hp": target.hp,
                "target_dead": False,
            }

        dmg_sides = 8 if attacker.class_type == "Warrior" else (6 if attacker.class_type == "Mage" else 4)
        dmg_roll = DiceRoller.roll(dmg_sides, 1, max(1, mod))
        damage = dmg_roll["total"]
        if attack_roll["is_crit_success"]:
            damage += dmg_roll["subtotal"]

        target.take_damage(damage)

        return {
            "hit": True,
            "attack_roll": attack_roll,
            "damage": damage,
            "target_hp": target.hp,
            "target_dead": not target.is_alive(),
        }
