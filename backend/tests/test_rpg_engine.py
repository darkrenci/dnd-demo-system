"""
Unit test suite for Python RPG engine modules.
Verifies DiceRoller, CharacterModel, MonsterModel, and CombatEngine.
"""

import unittest
from backend.game.engine import DiceRoller, CharacterModel, MonsterModel, CombatEngine


class TestRPGSystem(unittest.TestCase):

    def test_dice_bounds(self):
        for sides in [4, 6, 8, 10, 12, 20, 100]:
            roll = DiceRoller.roll(sides, count=5, modifier=2)
            self.assertEqual(len(roll["rolls"]), 5)
            for r in roll["rolls"]:
                self.assertGreaterEqual(r, 1)
                self.assertLessEqual(r, sides)
            self.assertEqual(roll["total"], sum(roll["rolls"]) + 2)

    def test_character_creation(self):
        warrior = CharacterModel("c1", "Aric", "Human", "Warrior")
        self.assertEqual(warrior.name, "Aric")
        self.assertGreater(warrior.max_hp, 20)
        self.assertTrue(warrior.is_alive())

        mage = CharacterModel("c2", "Elara", "Elf", "Mage")
        self.assertEqual(mage.class_type, "Mage")
        self.assertGreater(mage.max_mp, 15)

    def test_monster_creation_and_damage(self):
        goblin = MonsterModel("m1", "Goblin Sentry", "Goblin", hp=15, ac=12, attack_mod=3, damage_dice="1d6", xp_reward=50, gold_reward=10)
        self.assertEqual(goblin.hp, 15)
        goblin.take_damage(6)
        self.assertEqual(goblin.hp, 9)
        self.assertTrue(goblin.is_alive())
        goblin.take_damage(10)
        self.assertFalse(goblin.is_alive())

    def test_combat_resolution(self):
        char = CharacterModel("c1", "Aric", "Human", "Warrior")
        monster = MonsterModel("m1", "Skeleton", "Skeleton", hp=12, ac=10, attack_mod=2, damage_dice="1d6", xp_reward=40, gold_reward=8)

        outcome = CombatEngine.player_attack(char, monster)
        self.assertIn("hit", outcome)
        self.assertIn("target_hp", outcome)


if __name__ == "__main__":
    unittest.main()
