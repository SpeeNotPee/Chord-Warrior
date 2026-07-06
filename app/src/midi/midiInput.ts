import type { MidiNote } from '@chordwarrior/harmonic-engine';

const NOTE_ON = 0x9;
const NOTE_OFF = 0x8;

export type MidiNoteListener = (heldNotes: MidiNote[]) => void;

/**
 * Tracks note-on/note-off messages across all connected Web MIDI inputs and
 * aggregates currently-held notes into a sorted array of absolute MIDI numbers.
 */
export class MidiInputTracker {
  private heldNotes = new Set<MidiNote>();
  private listeners = new Set<MidiNoteListener>();
  private access: MIDIAccess | null = null;
  private boundInputs = new Set<MIDIInput>();

  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  async start(): Promise<void> {
    if (!this.isSupported) throw new Error('Web MIDI API is not supported in this environment.');
    this.access = await navigator.requestMIDIAccess();
    this.attachToAllInputs();
    this.access.onstatechange = () => this.attachToAllInputs();
  }

  stop(): void {
    this.boundInputs.forEach((input) => (input.onmidimessage = null));
    this.boundInputs.clear();
    if (this.access) this.access.onstatechange = null;
    this.access = null;
    this.heldNotes.clear();
  }

  onChange(listener: MidiNoteListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getHeldNotes(): MidiNote[] {
    return Array.from(this.heldNotes).sort((a, b) => a - b);
  }

  private attachToAllInputs(): void {
    if (!this.access) return;
    for (const input of this.access.inputs.values()) {
      if (this.boundInputs.has(input)) continue;
      input.onmidimessage = (event: MIDIMessageEvent) => this.handleMessage(event);
      this.boundInputs.add(input);
    }
  }

  private handleMessage(event: MIDIMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 3) return;
    const status = data[0] >> 4;
    const note = data[1];
    const velocity = data[2];

    if (status === NOTE_ON && velocity > 0) {
      this.heldNotes.add(note);
    } else if (status === NOTE_OFF || (status === NOTE_ON && velocity === 0)) {
      this.heldNotes.delete(note);
    } else {
      return;
    }
    this.notify();
  }

  private notify(): void {
    const notes = this.getHeldNotes();
    this.listeners.forEach((l) => l(notes));
  }
}
