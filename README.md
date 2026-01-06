# Blockchain Mining Simulator

A learning-focused web simulator that lets you **interact with mining step by step**.  
It visualizes the hash puzzle, difficulty, nonce, miner competition, block creation, and rewards.

## Key Features

- Difficulty slider to feel how success probability changes
- Manual nonce control and auto mining
- Multi-miner competition mode
- Block creation and chain linking visualization
- Reward accumulation and event log
- Educational guidance and explanations

## Layout

- Left: Network / miners panel
- Center: Hash puzzle + block creation + chain area
- Right: Concept explanations + status summary
- Bottom: Event log

## Run

Open `index.html` in your browser.

## Controls

- Adjust `Difficulty` to change the target.
- Enter a `Nonce` directly or click `Increment` to try the next value.
- Use `Auto Mine` to run the simulation automatically.
- Toggle `Competition Mode` to watch multiple miners race.
- Click `Reset Simulation` to start over.

## Project Structure

- `index.html` - UI layout
- `styles.css` - styles and animations
- `app.js` - simulation logic and interactions

## Educational Notice

This simulator simplifies cryptographic complexity for learning purposes and is
not related to real cryptocurrency mining.
