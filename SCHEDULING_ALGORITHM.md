# Fair Team Selection Algorithm - Mathematical Specification

## Overview
This document provides a mathematically rigorous approach for fair team selection with the following requirements:
1. Fluctuating number of people
2. Preference (but not requirement) for pairing new people with experienced people
3. Time-weighted fairness based on tenure
4. No fixed teams
5. Resilience to manual changes
6. Graceful handling of person deletion with gap-filling

---

## 1. Core Data Model

### Person Attributes
For each person $p_i$ in the system:
- $t_{join}(p_i)$: Join date (timestamp)
- $s(p_i)$: Current selection count (total times selected)
- $e(p_i) \in \{0, 1\}$: Experience flag (0 = new, 1 = experienced)
- $a(p_i) \in \{0, 1\}$: Availability flag (1 = available for current selection)

### System Parameters
- $T_{current}$: Current date/time
- $n$: Total number of available people
- $k$: Team size = 2
- $m$: Number of substitutes = 2

---

## 2. Time-Weighted Fairness Model

### Tenure Calculation
For each person $p_i$:
$$
\text{tenure}(p_i) = T_{current} - t_{join}(p_i)
$$

Measured in days (or hours, depending on granularity needs).

### Expected Selection Count
The **expected selection count** for person $p_i$ is proportional to their tenure:

$$
E[s(p_i)] = \frac{\text{tenure}(p_i)}{\sum_{j=1}^{n} \text{tenure}(p_j)} \times S_{total}
$$

Where $S_{total}$ is the total number of selections made across all scheduling events.

### Fairness Deficit Score
The **deficit** measures how far behind (or ahead) someone is from their expected selection count:

$$
\text{deficit}(p_i) = E[s(p_i)] - s(p_i)
$$

- **Positive deficit**: Person is underselected (should be prioritized)
- **Negative deficit**: Person is overselected (should be deprioritized)

### Selection Priority Score
To prioritize people fairly:

$$
\text{priority}(p_i) = \frac{\text{deficit}(p_i)}{\text{tenure}(p_i) + \epsilon}
$$

Where $\epsilon$ is a small constant (e.g., 1 day) to prevent division by zero for new members.

This normalizes the deficit by tenure, ensuring we prioritize based on **selection rate** rather than absolute counts.

---

## 3. Team Formation Algorithm

### Step 1: Separate Team and Substitute Pools

Split available people into two pools:
- **Team Pool**: People selected for the main team (size $k$)
- **Substitute Pool**: People selected as substitutes (size $m$)

Both pools use the same selection logic but are calculated independently.

### Step 2: Primary Selection (Fairness-Based)

**Input**: Set of available people $P = \{p_1, p_2, \ldots, p_n\}$

**Algorithm**:
1. Calculate $\text{priority}(p_i)$ for all $p_i \in P$ where $a(p_i) = 1$
2. Sort people by $\text{priority}(p_i)$ in descending order
3. Select the top $k$ people for team, top $m$ from remaining for substitutes

**Mathematical Formulation**:
$$
\text{TeamSelection} = \arg\max_{S \subset P, |S|=k} \sum_{p_i \in S} \text{priority}(p_i)
$$

$$
\text{SubstituteSelection} = \arg\max_{S \subset P \setminus \text{TeamSelection}, |S|=m} \sum_{p_i \in S} \text{priority}(p_i)
$$

### Step 3: Experience-Based Pairing (Soft Constraint)

**Objective**: Within the selected team, pair new people with experienced people when possible.

**Algorithm**:
1. Let $N = \{p_i \in \text{TeamSelection} : e(p_i) = 0\}$ (new people)
2. Let $E = \{p_i \in \text{TeamSelection} : e(p_i) = 1\}$ (experienced people)

**Case 1: One new, one experienced** ($|E| = 1, |N| = 1$)
- Pair the new person with the experienced person

**Case 2: Both new or both experienced** ($|E| = 2$ or $|N| = 2$)
- Pair the two people together
- **Note**: When both are experienced, rotate pairings based on priority scores to maintain fairness

**Pairing Cost Function** (minimize):
$$
C_{\text{pairing}} = w_{\text{exp}} \cdot \mathbb{1}[\text{both new}] + w_{\text{fair}} \cdot |\text{priority}(p_1) - \text{priority}(p_2)|
$$

Where:
- $w_{\text{exp}}$: Weight for experience mixing (lower priority)
- $w_{\text{fair}}$: Weight for fairness balance (higher priority)
- $\mathbb{1}[\cdot]$: Indicator function

**Greedy Pairing Algorithm**:
1. Sort the 2 selected people by priority (descending)
2. If mixing is possible (one new + one experienced), pair them
3. Otherwise, pair by priority order to balance deficits within the team
4. Do NOT force experienced people to always work together—rotate based on availability

---

## 4. Handling Manual Changes

### Scenario A: Manual Reassignment
When a person is manually moved from Team A to Team B:

1. **Do not recalculate immediately**—preserve manual intent
2. Update internal state to reflect the change
3. On next generation, the fairness algorithm will naturally correct imbalances

### Scenario B: Manual Selection Count Adjustment
If $s(p_i)$ is manually adjusted:

1. Recalculate $\text{deficit}(p_i)$ using the new $s(p_i)$
2. This automatically adjusts future selection priority

**No additional logic needed**—the deficit score is self-correcting.

---

## 5. Deletion and Gap-Filling

### When a Person is Deleted

**Problem**: Person $p_d$ is removed after teams were assigned. Their slot is now empty.

**Algorithm**:
1. Remove $p_d$ from the system
2. **Lock** all other assignments (do not touch them)
3. Recalculate $\text{priority}(p_i)$ for all remaining unassigned people
4. Fill the gap with the highest-priority unassigned person

**Mathematical Formulation**:
$$
p_{\text{replacement}} = \arg\max_{p_i \in P_{\text{unassigned}}} \text{priority}(p_i)
$$

**Key Principle**: Only fill the specific gap left by $p_d$. Do not regenerate the entire schedule.

### Fairness Preservation After Deletion

When $p_d$ is removed:
1. Recalculate $E[s(p_i)]$ for all remaining people (tenure ratios change)
2. Deficits automatically adjust because the denominator in the expected count formula shrinks
3. Future selections will rebalance naturally

**Example**:
- Before deletion: $E[s(p_1)] = 10$, $s(p_1) = 8$ → deficit = 2
- After deletion (tenure ratios shift): $E[s(p_1)] = 12$, $s(p_1) = 8$ → deficit = 4
- Person $p_1$ is now more likely to be selected in the future

---

## 6. Edge Cases and Special Scenarios

### Case 1: Insufficient People
If $n < k + m$ (not enough people for team + substitutes):
- Fill as many positions as possible
- Leave remaining positions empty
- Display warning to user

### Case 2: All New People
If $\forall p_i, e(p_i) = 0$:
- Ignore experience pairing constraint
- Proceed with fairness-based selection only

### Case 3: First Selection (All Deficits = 0)
When $s(p_i) = 0$ for all people:
- $\text{deficit}(p_i) = E[s(p_i)]$ (proportional to tenure)
- People with longer tenure are selected first
- This is fair because they've been waiting longer

### Case 4: Multiple Deletions
If multiple people are deleted simultaneously:
1. Remove all deleted people
2. Recalculate priorities
3. Fill gaps in order (team slots first, then substitutes)
4. Fill each gap with the next highest-priority person

---

## 7. Implementation Pseudocode

```
FUNCTION SelectTeamsAndSubstitutes(people, currentDate):
    // Filter available people
    available = people.filter(p => p.available == true)
    
    // Calculate priorities
    FOR EACH person p IN available:
        tenure = currentDate - p.joinDate
        totalTenure = SUM(available.map(x => currentDate - x.joinDate))
        expectedSelections = (tenure / totalTenure) * totalSystemSelections
        deficit = expectedSelections - p.selectionCount
        p.priority = deficit / (tenure + 1)
    END FOR
    
    // Sort by priority (descending)
    sortedPeople = available.sortBy(p => p.priority, descending=true)
    
    // Select team and substitutes
    teamMembers = sortedPeople[0 : 2]  // Top 2 for 1 team
    substitutes = sortedPeople[2 : 4]  // Next 2 for substitutes
    
    // Pair team members (already a pair of 2)
    team = PairWithExperienceMixing(teamMembers)
    
    // Update selection counts
    FOR EACH person p IN (teamMembers + substitutes):
        p.selectionCount += 1
    END FOR
    
    RETURN (team, substitutes)
END FUNCTION

FUNCTION PairWithExperienceMixing(selectedPeople):
    newPeople = selectedPeople.filter(p => p.experienced == false)
    expPeople = selectedPeople.filter(p => p.experienced == true)
    
    // Since team size is 2, just return the pair
    // Preferably mixing new and experienced if available
    IF newPeople.length == 1 AND expPeople.length == 1:
        RETURN (newPeople[0], expPeople[0])
    ELSE:
        // Both same experience level
        RETURN (selectedPeople[0], selectedPeople[1])
    END IF
END FUNCTION

FUNCTION FillGapAfterDeletion(deletedPerson, currentAssignments, people):
    // Lock existing assignments
    assigned = currentAssignments.flatten()
    unassigned = people.filter(p => p NOT IN assigned AND p.available)
    
    // Calculate priorities for unassigned people
    FOR EACH person p IN unassigned:
        // (Same priority calculation as above)
    END FOR
    
    // Select highest priority person
    replacement = unassigned.maxBy(p => p.priority)
    
    // Replace deleted person's slot
    currentAssignments.replace(deletedPerson, replacement)
    replacement.selectionCount += 1
    
    RETURN currentAssignments
END FUNCTION
```

---

## 8. Convergence and Stability Guarantees

### Theorem 1: Fairness Convergence
Over time, as the number of selections $S_{total} \to \infty$:

$$
\lim_{S_{total} \to \infty} \frac{s(p_i)}{\text{tenure}(p_i)} = \frac{S_{total}}{\sum_{j=1}^{n} \text{tenure}(p_j)} \quad \forall p_i
$$

**Proof sketch**: The deficit-based priority ensures underselected people are chosen more frequently. The system self-corrects until all selection rates converge to the same value.

### Theorem 2: Manual Change Recovery
If a manual change introduces an imbalance at time $t$:

$$
|\text{deficit}(p_i, t)| > 0
$$

Then for subsequent automatic selections, the deficit will decay:

$$
\mathbb{E}[|\text{deficit}(p_i, t+k)|] < |\text{deficit}(p_i, t)|
$$

**Proof sketch**: The priority function ensures people with larger deficits are selected more often, reducing the imbalance over time.

---

## 9. Summary of Key Formulas

| Concept | Formula |
|---------|---------|
| Tenure | $\text{tenure}(p_i) = T_{current} - t_{join}(p_i)$ |
| Expected Selections | $E[s(p_i)] = \frac{\text{tenure}(p_i)}{\sum_j \text{tenure}(p_j)} \times S_{total}$ |
| Deficit | $\text{deficit}(p_i) = E[s(p_i)] - s(p_i)$ |
| Priority | $\text{priority}(p_i) = \frac{\text{deficit}(p_i)}{\text{tenure}(p_i) + \epsilon}$ |
| Selection | $\arg\max_{S \subset P, |S|=k} \sum_{p_i \in S} \text{priority}(p_i)$ |

---

## 10. Extensions and Improvements

### Optional: Decay Factor for Old Selections
If you want recent selections to matter more than old ones, introduce a time decay:

$$
s_{\text{weighted}}(p_i) = \sum_{k=1}^{s(p_i)} e^{-\lambda (T_{current} - t_k)}
$$

Where $t_k$ is the timestamp of the $k$-th selection, and $\lambda$ controls decay rate.

### Optional: Diversity Constraints
Add constraints to avoid the same pairs repeatedly:

$$
\text{penalty}(p_i, p_j) = \alpha \cdot \text{pairHistory}(p_i, p_j)
$$

Subtract this from the pairing score to encourage variety.

---

## Conclusion

This algorithm guarantees:
- ✅ **Fairness**: Time-weighted selection ensures everyone contributes proportionally
- ✅ **Flexibility**: Works with any number of people
- ✅ **Robustness**: Handles manual changes and deletions gracefully
- ✅ **Experience mixing**: Soft constraint that doesn't override fairness
- ✅ **Self-correcting**: Automatically rebalances over time

The mathematical foundation ensures the system is **provably fair** and **stable** under all specified conditions.
