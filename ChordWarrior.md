# **Production Specification: Multi-Modal Polyphonic Chord Training Application**

## **1\. Project Overview & Objectives**

The goal is to build a highly responsive, cross-platform chord training application designed to drill sight-reading, ear training, and improvisational keyboard muscle memory. The application presents chord progressions dynamically and verifies user performance via dual-channel input validation (MIDI and Acoustic Polyphonic Audio).

### **Core Features**

* **Dynamic Clef Switching:** Instantly redraws chord notation across Treble, Bass, Alto, and Tenor clefs.  
* **Dual-Engine Progression Generation:** Offers users a choice between a curated library of historical/functional progressions or a rule-based algorithmic generation engine.  
* **Dual-Input Validation System:** Processes simultaneous physical MIDI input and raw microphone audio parsing for polyphonic pitch detection.  
* **Multi-Platform Target:** Deployable to iOS, Android, and lightweight Desktop builds without administrative permission barriers.

## **2\. Architecture & Tech Stack**

### **Frontend & Container Framework**

* **Core Architecture:** React / React Native (Expo) code split structure.  
* **Desktop Wrapper:** **Tauri** packaging the React web build for ultra-lightweight, zero-admin-required desktop targets (.exe, .AppImage).  
* **State Management:** Lightweight React Context or Zustand for cross-module synchronization (Harmonic Engine \-\> Visual Renderer \-\> Input Grader).

### **Audio & Notation Libraries**

* **Visual Sheet Music Renderer:** VexFlow or abcjs embedded in a reactive container component.  
* **Audio Synthesis Engine:** Tone.js for web/desktop targets; expo-av or native sound synths for mobile listening modes.  
* **Acoustic Signal Processing:** Web Audio API (AnalyserNode) combined with a custom polyphonic pitch detection worker (FFT \+ Peak Detection tracking multiple fundamental frequencies).

## **3\. Core Modules**

### **Module A: The Harmonic Engine**

The state manager must instantiate an engine capable of handling two modes of progression generation based on user preference:

#### **1\. Predefined Library Mode**

* **Data Structure:** A static JSON ledger containing curated chord sequences.  
* **Categories:** \* *Baroque/Classical:* Perfect authentic cadences, plagal cadences, circle-of-fifths sequences.  
  * *Jazz:* ii-V-I variations (major and minor), secondary dominants, turnarounds, tritone substitutions.  
  * *Pop/Rock:* I-V-vi-IV, vi-IV-I-V progressions.  
* **Properties:** Each entry contains structural voice-leading patterns to prevent erratic, unplayable leaps between positions.

#### **2\. Algorithmic Engine Mode**

* **Logic Framework:** A Markov-chain style state machine governing functional harmony rules (Tonic $\\rightarrow$ Subdominant $\\rightarrow$ Dominant $\\rightarrow$ Tonic).  
* **User Adjustments:**  
  * *Key Center & Mode:* Selectable root (C, C\#, etc.) and quality (Major, Natural Minor, Harmonic Minor).  
  * *Complexity Tiers:* Tier 1 (Diatonic triads), Tier 2 (Standard 7th chords), Tier 3 (Extended/altered chords like $Am(maj7)$, $Am(add9)$, voicings with sharp/flat extensions).  
  * *Voice Leading:* Automated calculation to minimize movement of common tones between sequential chords.

### **Module B: Interaction Modes & Visual UI**

The interface must cycle dynamically through three explicit states while preserving active time signatures and tempo:

| Mode | Visual Presentation | Audio Output | Goal |
| :---- | :---- | :---- | :---- |
| **Sheet Music** | Dynamic grand staff rendering via VexFlow. Clef is interchangeable via a toggle (Treble, Bass, Alto, Tenor). | Silent (until user plays) | Direct sight-reading execution. |
| **Chord Notation** | Raw text symbols (e.g., $C\\Delta 7$, $F\\\#m7\\flat 5$) or Roman Numerals ($ii^7 \- V^7 \- I$). | Silent (until user plays) | Chord symbol decoding and voicing realization. |
| **Listening** | Hidden visual prompt. Blank screen or indicator icon. | Audio synthesis engine plays the chord cleanly once. | Dictation, ear training, and chord quality replication. |

#### **Clef Conversion Engine**

A utility script must map standard absolute MIDI pitch values (e.g., 60 for Middle C) to corresponding graphical locations based on the currentClef state variable. Moving the clef parameter shifts the canvas offset lines mathematically without modifying the underlying absolute pitch requirement.

### **Module C: Dual-Input Validation Pipeline (The "Grader")**

                 \+-------------------+  
                 | User Inputs Keys  |  
                 \+---------+---------+  
                           |  
         \+-----------------+-----------------+  
         |                                   |  
         v                                   v  
\+--------+--------+                 \+--------+--------+  
|  MIDI Pipeline  |                 | Audio Pipeline  |  
| (Web MIDI API)  |                 |  (Microphone)   |  
\+--------+--------+                 \+--------+--------+  
         |                                   |  
         | Raw Note Array                    | FFT Spectrum Analysis  
         v                                   v  
\+--------+--------+                 \+--------+--------+  
| Parse Key States|                 | Polyphonic Pitch|  
| \[60, 64, 67\]    |                 | \[261Hz, 329Hz\]  |  
\+--------+--------+                 \+--------+--------+  
         |                                   |  
         \+-----------------+-----------------+  
                           | Verified Pitches  
                           v  
              \+------------+------------+  
              |   Grading State Engine  |  
              | (Validation & Inversion)|  
              \+-------------------------+

The validation layer runs two concurrent background listeners to assess input execution:

#### **1\. MIDI Validation**

* Tracks note-on and note-off messages.  
* Aggregates held notes into an array of integers representing absolute MIDI numbers.

#### **2\. Acoustic Sound Validation**

* Accesses system/device microphone arrays using native permissions.  
* Processes a real-time Fast Fourier Transform (FFT) window.  
* Applies peak detection to isolate distinct fundamental frequencies ($f\_0$).  
* Converts identified frequencies to MIDI integers using standard mathematical mapping:  
  $$n \= 69 \+ 12 \\log\_2\\left(\\frac{f}{440}\\right)$$

#### **3\. Grading Logic Rules**

* **Loose Settings:** Validates entry if the played pitch array contains the exact pitch classes (root, third, fifth, extensions) regardless of spacing or root inversion.  
* **Strict Settings:** Requires an exact match of the specific note layout and layout inversions displayed on the rendering engine canvas.

## **4\. Implementation Step Sequence for Claude Code**

Execute the build sequentially utilizing the following prompt workflow instructions:

### **Step 1: Core Harmonic Foundation**

Create a standalone TypeScript module for music logic. Implement definitions for standard musical notes, intervals, chord formulas (Triads, 7ths, altered extensions like maj7, add9), and key signatures. Write a HarmonicEngine class containing:

1. A static library of historical progressions (Baroque, Jazz, Pop).  
2. An algorithmic procedural generation function using basic functional harmony progression states, scale constraints, and a difficulty parameter.

### **Step 2: Input Pipelines & Detection**

Implement the validation pipeline. Write a React hook useChordValidator that initializes Web MIDI listeners. Beside it, implement a Web Audio API microphone stream pipeline utilizing an FFT analyzer script to detect multiple steady fundamental frequencies simultaneously, compiling detected audio inputs into standard MIDI note numbers.

### **Step 3: UI Rendering Components**

Build the UI layout in React. Integrate VexFlow inside a dedicated component that takes an array of absolute MIDI pitches and a clef parameter ('treble', 'bass', 'alto', 'tenor') and renders the staff presentation dynamically. Build layout wrappers for switching UI visibility states between Sheet Music, Chord Notation, and Listening Modes.

### **Step 4: Configuration & Build Bundling**

Integrate the modules into a primary interface with controls for mode, progression type, strictness, and pitch-detection settings. Configure an Expo project structure alongside a tauri.conf.json build deployment configuration to allow compiled outputs targeting mobile platforms and lightweight portable desktop native installations.