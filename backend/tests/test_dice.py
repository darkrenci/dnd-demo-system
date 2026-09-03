"""
Unit Tests for Server-Authoritative Dice Engine
"""

import unittest
import random
from backend.game.dice import roll_die, SUPPORTED_DICE

class TestDiceEngine(unittest.TestCase):
    def test_supported_dice_types(self):
        for sides in SUPPORTED_DICE:
            res = roll_die(sides=sides, count=1, modifier=0)
            self.assertEqual(res.count, 1)
            self.assertEqual(len(res.rolls), 1)
            self.assertTrue(1 <= res.rolls[0] <= sides)
            self.assertEqual(res.total, res.rolls[0])

    def test_roll_with_modifier(self):
        res = roll_die(sides=20, count=1, modifier=4)
        self.assertEqual(res.modifier, 4)
        self.assertEqual(res.total, res.rolls[0] + 4)

    def test_deterministic_roll(self):
        # Using a fixed seed random generator
        rng1 = random.Random(42)
        rng2 = random.Random(42)
        res1 = roll_die(sides=6, count=3, modifier=2, rng=rng1)
        res2 = roll_die(sides=6, count=3, modifier=2, rng=rng2)
        self.assertEqual(res1.rolls, res2.rolls)
        self.assertEqual(res1.total, res2.total)

    def test_invalid_die(self):
        with self.assertRaises(ValueError):
            roll_die(sides=7)

    def test_invalid_count(self):
        with self.assertRaises(ValueError):
            roll_die(sides=20, count=0)

if __name__ == '__main__':
    unittest.main()
