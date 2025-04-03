


Based on the results I've seen, I'd characterize the winner distribution as moderately balanced but with some clustering patterns.
For a racing game, this kind of distribution is actually quite realistic - in real horse racing, some horses consistently perform better than others due to their attributes, but upsets still happen. 
We could further narrow the skill variance range in the randomizeSkills method, but that might make races less exciting.

Here's my analysis:
--Test Sequence--
Win Distribution:

Shell Beach: 6 wins (19.4%)
Aura Boost: 6 wins (19.4%)
Green Lightning: 4 wins (12.9%)
Royal Thunder: 4 wins (12.9%)
Silver Moon: 3 wins (9.7%)
Duke Champion: 3 wins (9.7%)
Orchid Dream: 2 wins (6.5%)
Pink Paladin: 2 wins (6.5%)
Rose Runner: 1 win (3.2%)
Observations:

You have 9 different winners out of 12 possible horses, which is good for diversity
Shell Beach and Aura Boost dominate with ~39% of wins between them
Some horses (like Rose Runner) seem underrepresented
There are 3 horses that didn't win at all in this sample
A perfectly uniform distribution would give each horse roughly an 8.3% win rate.

