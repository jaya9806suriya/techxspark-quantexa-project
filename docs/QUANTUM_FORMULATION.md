# Quantum Mathematical Formulation: Traffic Signal & Route QUBO

## 1. Objective Function

The traffic signal synchronization and route split problem is mapped to Quadratic Unconstrained Binary Optimization (QUBO):

$$\min_{x \in \{0,1\}^n} H(x) = x^T Q x = \sum_i Q_{ii} x_i + \sum_{i < j} Q_{ij} x_i x_j$$

Where:
- $x_i \in \{0, 1\}$ denotes binary activation for phase assignment (e.g., North-South Green vs. East-West Green).
- $Q_{ii} < 0$ encodes linear vehicle pressure on approach $i$.
- $Q_{ij} > 0$ encodes severe conflict penalty for intersecting conflicting green phases (Hard constraint translated to soft quadratic penalty: $\lambda (x_i + x_j - 1)^2$).
- $Q_{ik} < 0$ encodes cooperative green-wave phase offsets between consecutive arterial intersections.

## 2. QAOA (Quantum Approximate Optimization Algorithm)

We map the QUBO cost Hamiltonian $H_C = \sum_{i,j} J_{ij} Z_i Z_j + \sum_i h_i Z_i$ and construct the parameterized ansatz:

$$|\psi(\boldsymbol{\gamma}, \boldsymbol{\beta})\rangle = \prod_{l=1}^p e^{-i \beta_l H_M} e^{-i \gamma_l H_C} |+\rangle^{\otimes n}$$

- Mixer Hamiltonian: $H_M = \sum_{i=1}^n X_i$
- Classical optimizer (COBYLA/SPSA) tunes variational angles $\boldsymbol{\gamma}, \boldsymbol{\beta}$ to minimize $\langle H_C \rangle$.

## 3. Demo Implementation Note on Variational Parameters

For real-time demonstration performance and low-latency response during live hackathon evaluation, the QAOA engine utilizes single-shot parameterized ansatz initialization with calibrated heuristic variational angles ($\gamma_l = \frac{\pi}{8}(l+1), \beta_l = \frac{\pi}{4(l+1)}$). The quantum circuit is constructed using Qiskit and executed on Qiskit Aer QPU simulator, sampling $N=1024$ shots to evaluate measurement bitstring distributions.
