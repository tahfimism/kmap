(function() {
    window.KMapDefaultProblems = [
        {
            "id": "pyq_2025_midterm_q1",
            "source": "Midterm 2025, Q1",
            "N": 3,
            "minterms": [1, 3, 5, 7],
            "dontcares": [],
            "difficulty": "easy",
            "hints": [
                "Combine all adjacent cells into the largest single loop possible.",
                "Think about what variable changes state between these cells."
            ]
        },
        {
            "id": "pyq_2025_midterm_q2",
            "source": "Midterm 2025, Q2 (Edge Case)",
            "N": 4,
            "minterms": [0, 2, 8, 10],
            "dontcares": [],
            "difficulty": "medium",
            "hints": [
                "K-maps wrap around both left-to-right and top-to-bottom.",
                "Look at the four corner cells. Can they be grouped into a single loop?"
            ]
        },
        {
            "id": "pyq_2024_final_q3",
            "source": "Final Exam 2024, Q3 (Don't-Care Guide)",
            "N": 4,
            "minterms": [1, 5, 12, 13],
            "dontcares": [9, 15],
            "difficulty": "medium",
            "hints": [
                "Don't-cares (X) can be treated as 1 to make groups larger, or ignored if they don't help.",
                "Try to group {1, 5, 9, 13} using the don't care at 9.",
                "Try to group {12, 13, 15} with something else, or does 15 help expand {12, 13} to a group of 4?"
            ]
        },
        {
            "id": "pyq_2024_makeup_q4",
            "source": "Makeup Exam 2024, Q4 (Redundancy Trap)",
            "N": 4,
            "minterms": [2, 3, 6, 7, 8, 10, 12, 14],
            "dontcares": [],
            "difficulty": "hard",
            "hints": [
                "Ensure every minterm is covered by the largest possible group.",
                "Watch out for overlapping loops. Is there a loop that is entirely covered by other loops?"
            ]
        }
    ];
})();
