# 🚦 Quantum-Enhanced Adaptive Urban Traffic Optimization

## Team TechXSpark

A Hybrid Quantum-Classical Traffic Optimization Platform designed to dynamically optimize traffic signals across multiple interconnected urban intersections.

The system combines **QUBO, QAOA, adaptive traffic signal control, emergency green corridor routing, traffic simulation, and environmental analysis** to improve traffic flow and reduce congestion, waiting time, fuel consumption, and estimated CO₂ emissions.

---

## 🎯 Problem Statement

Urban traffic congestion is a major challenge in growing cities. Traditional traffic signals often depend on fixed timings and cannot efficiently respond to changing traffic conditions, accidents, road closures, or emergency vehicles.

Our project proposes a **Hybrid Quantum-Classical Traffic Optimization Platform** that dynamically manages traffic signals across multiple interconnected intersections.

The system models traffic signal optimization as a mathematical optimization problem and uses **QUBO and QAOA** to explore efficient signal configurations.

---

## 💡 Solution

Our system continuously analyzes simulated traffic conditions such as:

- 🚗 Vehicle density
- 🚦 Queue length
- 🛣️ Road capacity
- ⚡ Average vehicle speed
- 🚶 Pedestrian demand
- 🚑 Emergency vehicle priority
- 🔄 Signal status

Based on these conditions, the system dynamically adjusts traffic signal timings.

---

## ⭐ Key Features

### 1. Hybrid Quantum-Classical Optimization

Traffic signal optimization is formulated as a **QUBO (Quadratic Unconstrained Binary Optimization)** problem.

The QUBO model considers:

- Waiting time
- Queue length
- Traffic congestion
- Fuel consumption
- CO₂ emissions
- Emergency vehicle delay
- Signal switching

The QUBO formulation is then processed using a **QAOA (Quantum Approximate Optimization Algorithm)** workflow.

---

### 2. Multi-Intersection Traffic Network

The prototype models multiple interconnected intersections.

Example:

```text
        I2 - North
          |
          |
I5 ---- I1 ---- I3
West   Central   East
          |
          |
        I4 - South
          |
        I6 - Hospital